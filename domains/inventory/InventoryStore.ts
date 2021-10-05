import { injectable, inject } from 'inversify';
import { observable, action, ObservableMap, runInAction, when} from 'mobx';
import { IInventoryItemModel, InventoryItemModel, foodMeasurement, storageFormat, storageLocation, foodCategory } from './InventoryItemModel';
import { object, serializable, map, update } from 'serializr';
import { InjectableBase } from '../../../InjectableBase';
import { ServiceTypes, DomainTypes } from '../../../Types';
import { ILocalStorageService } from '../../services/LocalStorageService';
import moment = require('moment');
import { IInventoryService } from 'services/InventoryService';
import { GTINItemModel, IGTIN } from './GTINItemModel';
import Amplify from '@aws-amplify/core';
import Auth from '@aws-amplify/auth';
import awsconfig from "../../../aws-exports";

import * as GTIN_brand from '../../assets/json/gtin/brand_data.json';
// import * as GTIN_GPC from '../../assets/json/gtin/gpc_data.json';

export interface IInventoryStore {
    currentInventoryItems: ObservableMap<string, InventoryItemModel>;
    isGTINPowerUser: boolean;
    shouldAddGTINCache: boolean;
    addItem(newItemData:InventoryItemModel, overwrite?: boolean): Promise<boolean>;
    updateItem(newItemData:IInventoryItemModel): Promise<boolean>;
    removeItem(itemId: string): Promise<boolean>;
    itemExists(itemId: string): boolean;
    validateAndConvertDecimals(itemData:IInventoryItemModel): string;
    getItem(itemId: string): IInventoryItemModel;
    areIdsEqual(A:IInventoryItemModel, B:IInventoryItemModel): boolean;
    clearItems(): void;
    lookupGTIN(GTIN: string):Promise<GTINItemModel>;
    getBrandByBSIN(BSIN: string): string;
    getUID(): string;
    updateGTINCache(GTIN: string, item:IInventoryItemModel, requestGTINUpdate: boolean): Promise<void>;
    getListItemHeight(): number;
    signOut(): void;
    resync(): Promise<void>;
}

export interface IItemValidationData {
    id: string;
    lastUpdated: Date
}

export interface IGPC {
    GPC_CD: string,
    GPC_NM: string
}

export interface IBrand {
    BSIN: string,
    BRAND_NM: string
}

const kListItemHeight = 80;

@injectable()
export class InventoryStore extends InjectableBase implements IInventoryStore {

    shouldAddGTINCache = false;

    getListItemHeight() {
        return kListItemHeight;
    }

    async lookupGTIN(GTIN: string):Promise<GTINItemModel> {
        // check cache first
        if(this.GTINCache.has(GTIN)) {
            //console.warn("GTIN Cache Hit");
            return this.GTINCache.get(GTIN);
        }
        //console.warn("GTIN Cache Miss");
        if(this.awaitingGTINResponse) {
            //console.warn("Still waiting for last GTIN response...");
            return null;
        }
        // cache miss, request and cache the result
        try
        {
            this.awaitingGTINResponse = true;
            const response = await this.inventoryService.getGTIN(GTIN);
            this.awaitingGTINResponse = false;
            if(response) {
                //console.warn("Found GTIN, added to cache.");
                const GTINItem = new GTINItemModel(response);
                runInAction(() => this.GTINCache.set(GTINItem.GTIN_CD, GTINItem));
                return GTINItem;
            } else {
                // not found, add that to cache
                //console.warn("No GTIN Data, added null to cache.");
                runInAction(() => this.GTINCache.set(GTIN, null));
            }
        } catch (error) {
            console.error("InventoryStore.lookupGTIN", error);
        }
        
        return null;
    }

    getBrandByBSIN(BSIN: string): string {
        if(this.brandMap.has(BSIN)) {
            return this.brandMap.get(BSIN);
        }

        // all BSINs are accounted for in in our BSIN data
        // but we will writet the brand name here when caching
        // manually entered GTIN data, so giving it back should be safe
        return BSIN;
    }

    // where all our inventory items are ultimately kept
    // all reads and writes should come through accessors in this store
    // to flow through cache and network api
    @serializable(map(object(InventoryItemModel)))
    @observable
    currentInventoryItems: ObservableMap<string, InventoryItemModel>;

    @serializable(map(object(GTINItemModel)))
    @observable
    GTINCache: ObservableMap<String, GTINItemModel>;

    UID: string = "unauthorized";

    @observable
    isGTINPowerUser: boolean;

    private brandMap: Map<string, string> = new Map<string, string>();
    private awaitingGTINResponse = false;

    constructor(
        @inject(ServiceTypes.LocalStorage) private localStorageService: ILocalStorageService,
        @inject(ServiceTypes.Inventory) private inventoryService: IInventoryService
    ) {
        super(DomainTypes.Inventory);
        this.awaitDependenciesAndInit(arguments);
    }

    // clear everything out as if a new user is logging on
    signOut() {
        this.clearItems();
        // reset values and clear everything out
        runInAction(() => {
            this.UID = 'unauthorized';
            this.isGTINPowerUser = false;
            this.shouldAddGTINCache = false;
        });
        
    }

    async updateGTINCache(GTIN: string, item:IInventoryItemModel, requestGTINUpdate = false): Promise<void> {
        // convert lbs to oz and gallons to fl_oz for storage
        if(item.measurement === foodMeasurement.gal) {
            item.measurement = foodMeasurement.fl_oz;
            item.capacity *= 128;
        } else if (item.measurement === foodMeasurement.lb) {
            item.measurement = foodMeasurement.oz;
            item.capacity *= 16;
        }
        //console.warn("Updating GTIN cache...");
        // straight overwrite of whatever is there now
        const GTINItem: IGTIN = {
            GTIN_CD: GTIN,
            IMG: 0,
            M_OZ: item.measurement === foodMeasurement.oz ? item.capacity : null,
            M_FLOZ: item.measurement === foodMeasurement.fl_oz ? item.capacity : null,
            M_G: item.measurement === foodMeasurement.g ? item.capacity : null,
            GTIN_NM: `${item.variety}|${item.food}|`, // enclose the food name in |pipes| for parsing later
            BSIN_id: item.brand,
            K_PACKAGE: item.storageFormat,
            K_CATEGORY: item.foodCategories?.length > 0 ? item.foodCategories[0] : null
            // TODO implement something to translate our categories to GPC IDs
        }
        const itemModel = new GTINItemModel(GTINItem)
        runInAction(() => this.GTINCache.set(GTIN, itemModel));

        // no need to await the following, it can happen behind the scenes
        if(this.isGTINPowerUser && requestGTINUpdate) {
            //console.warn("GTIN Power User Add! Verifying Cloud has no data for " + GTIN);
            // SU will add this to the DB if it's not already there. Double check by directly invoking service here
            // This is a helpful check and provides DB udpate protect for this record up to the moment
            const response = await this.inventoryService.getGTIN(GTIN);

            if(!response) {
                // submit gtin data to database
                const createSuccess = await this.inventoryService.createGTIN(itemModel);
                if(createSuccess) {
                    console.warn("GTIN Power User Create Success!");
                } else {
                    console.warn("GTIN Power User Create Failure...");
                }
            } else {
                // update
                const updateSuccess = await this.inventoryService.updateGTIN(itemModel);
                if(updateSuccess) {
                    console.warn("GTIN Power User Update Success!");
                } else {
                    console.warn("GTIN Power User Update failure...");
                }
            }
        }

    }

    getUID(): string {
        return this.UID;
    }

    @action
    protected initDefaultValues(): void {
        this.currentInventoryItems = new ObservableMap<string, InventoryItemModel>();

        // build brand map
        for(let i = 0; i < GTIN_brand.default.length; i++) {
            const brand: IBrand = GTIN_brand[i];
            this.brandMap.set(brand.BSIN, brand.BRAND_NM);
        }

        runInAction(() => this.GTINCache = new ObservableMap<String, GTINItemModel>());
    }

    async resync(): Promise<void> {
        console.warn("resyncing");
        return await this.initAuthorized();
    }

    @action
    protected async init(): Promise<void> {
        try {
            await Auth.currentAuthenticatedUser();
            this.initAuthorized();
        } catch(error) {
            // not authorized, wait until logged in
            setTimeout(() => this.init(), 1000);
        }

        await this.localStorageService.hydrate(DomainTypes.Inventory, this, null);

        // DEBUG
        /*const BSIN = "1DBACS";
        console.warn("Brand BSID for " + BSIN + ": " + this.getBrandByBSIN(BSIN));
        const GTIN_num = "0762111206121";
        const coffee:IGTIN = await this.inventoryService.getGTIN(GTIN_num);
        console.warn("GTIN_NM for " + GTIN_num, coffee.GTIN_NM);*/
    }

    protected async initAuthorized(): Promise<void> {
        Amplify.configure(awsconfig);
        // UID
        const currentSession = await Auth.currentAuthenticatedUser();
        this.UID = currentSession?.username;

        // user group
        const response = await Auth.currentSession();
        const decoded = response.getIdToken().decodePayload();
        const groups = decoded['cognito:groups'];
        if(groups?.length > 0) {
            for(let i = 0; i < groups.length; i++) {
                const groupName = groups[i];
                // TODO Make a UserStore and put stuff like this in there
                if(groupName === "GTIN_POWER_USER") {
                    runInAction(() => this.isGTINPowerUser = true);
                }
            }
        }
        
        const cloudValidationData: IItemValidationData[] = await this.inventoryService.validationItems();
        // try to validate existing data, only pull all data if needed
        const isCloudDataSynced = await this.validateAndReconcileCloudData(cloudValidationData);
        if(!isCloudDataSynced) { // either we're missing a whole item from cloud data or stale/missing data couldn't reconcile
            // full overwrite update
            const cloudInventory: IInventoryItemModel[] = await this.inventoryService.listItems();
            runInAction(() => {
                if(cloudInventory?.length > 0) {
                    // overwrite whatever local store had with our cloud data
                    this.currentInventoryItems.clear();
                    for(let i = 0; i < cloudInventory.length; i++) {
                        this.currentInventoryItems.set(cloudInventory[i].id, new InventoryItemModel(cloudInventory[i], this.getUID()));
                    }
                }
            });
        }
    }

    //TODO take another look at this; too complex and doesn't pick up items on the server that aren't in local storage
    async validateAndReconcileCloudData(validationItems: IItemValidationData[], didAttemptReconcile = false): Promise<boolean> {
        const validatedItemIds: string[] = [];
        let isMissingItemsFromLocalStorage = false;
        let didReconcile = false;
        let reconcileFailure = false;
        // try to locate each item id in local storage and verify updated date
        
        if(validationItems) {
            const staleItems: IInventoryItemModel[] = [];
            for(let i = 0; i < validationItems.length; i++) {
                if(this.currentInventoryItems.has(validationItems[i].id)) {
                    const lastUpdatedCloud: Date = validationItems[i].lastUpdated;
                    const currentItem = this.currentInventoryItems.get(validationItems[i].id)
                    const lastUpdatedLocal: Date = currentItem.lastUpdated;
                    const diffSeconds: number = moment(lastUpdatedLocal).diff(lastUpdatedCloud, "seconds");
                    if(diffSeconds <= 1) {
                        validatedItemIds.push(validationItems[i].id);
                    } else {
                        // mark for update
                        staleItems.push(currentItem);
                    }
                } else {
                    isMissingItemsFromLocalStorage = true;
                }
            }
            // reconcile items that need updating
            if(staleItems.length > 0) {
                if(!didAttemptReconcile) {
                    for(let k = 0; k < staleItems.length; k++) {
                        const item = staleItems[k];
                        const lastUpdated = await this.inventoryService.updateItem(item);
                        if(lastUpdated) {
                            runInAction(() => this.getItem(item.id).lastUpdated = lastUpdated);
                        }
                    }
                    console.warn("Reconciled stale items");
                    didReconcile = true;
                } else {
                    reconcileFailure = true;
                }
            }
        }

        if(validatedItemIds.length !== this.currentInventoryItems.size) {
            if(!didAttemptReconcile) {
                // we have unsynced items in local storage, try to sync them
                const unsyncedItems: IInventoryItemModel[] = Array.from(this.currentInventoryItems.values()).slice(0).filter((item) => validatedItemIds.indexOf(item.id) === -1);
                for( let i = 0; i < unsyncedItems.length; i++) {
                    const item = unsyncedItems[i];
                    const lastUpdated = await this.inventoryService.addItem(item);
                    if(lastUpdated) {
                        runInAction(() => this.getItem(item.id).lastUpdated = lastUpdated);
                    }
                }
                console.warn("Reconciled items missing from cloud");
                didReconcile = true;
            } else {
                reconcileFailure = true;
            }   
        }

        if(isMissingItemsFromLocalStorage) {
            // hopefully updated and unsynced items are now reconciled, but if we're missing a whole
            // item from the cloud then we should do a full sync at this point
            console.warn("Item missing from local storage, resyncing all data");
            return false;
        }

        if(didReconcile && !didAttemptReconcile) {
            // try the validation once more
            const cloudValidationData: IItemValidationData[] = await this.inventoryService.validationItems();
            return await this.validateAndReconcileCloudData(cloudValidationData, true);
        }

        if(reconcileFailure) {
            console.error("Reconcile Failure, resyncing all data");
            return false;
        }

        console.warn("Data is synced!");
        return true;
    }

    async addItem(newItemData:InventoryItemModel, overwrite?: boolean): Promise<boolean> {
        if(!this.currentInventoryItems) this.init();

        if(this.currentInventoryItems.has(newItemData.id)) {
            if(overwrite) {
                console.log("InventoryStore.addItem - Performing item overwrite on " + newItemData.id);
                // no network needed, already handled. Just update inventory
                runInAction(() => {
                    this.currentInventoryItems.set(newItemData.id, newItemData);
                });
                return true;
            } else {
                console.warn("InventoryStore.addItem - Failed to perform item overwrite on " + newItemData.id);
                return false;
            }
        }

        if(!overwrite) {
            // only commit to setting locally when the network add was successful
            const lastUpdated = await this.inventoryService.addItem(newItemData);
            if(lastUpdated) {
                runInAction(() => {
                    newItemData.lastUpdated = lastUpdated;
                    this.currentInventoryItems.set(newItemData.id, newItemData);
                });
                return true;
            } else {
                return false;
            }
        }
        
    }

    @action
    async updateItem(newItemData:InventoryItemModel): Promise<boolean> {
        if(!this.currentInventoryItems) this.init();
        
        // has to exist in local store to even try to update in the cloud
        if(this.currentInventoryItems.has(newItemData.id)) {
            const lastUpdated = await this.inventoryService.updateItem(newItemData);
            if(lastUpdated) {
                runInAction(() => newItemData.lastUpdated = lastUpdated);
                this.addItem(newItemData, true);
                return true;
            } else {
                return false;
            }
        } else {
            console.warn("InventoryStore.updateItem - Can't update what doesn't exist: " + newItemData.id);
        }

        return false;
    }

    @action
    async removeItem(itemId: string): Promise<boolean> {
        if(!this.currentInventoryItems) this.init();
        
        if(this.currentInventoryItems.has(itemId)) {
            const response = await this.inventoryService.removeItem(itemId);
            if(response) {
                runInAction(() => this.currentInventoryItems.delete(itemId));
                return true;
            } else {
                return false;
            }
        } else {
            console.warn("InventoryStore.removeItem - Can't remove what doesn't exist...");
        }

        return false;
    }

    @action
    clearItems(): void {
        if(!this.currentInventoryItems) this.init();

        this.currentInventoryItems = new ObservableMap<string, InventoryItemModel>();
    }

    @action
    populateDebugInventoryItems() {
        const items:IInventoryItemModel[] = [
            {
                brand: "Safeway",
                variety: "Shitake",
                food: "Mushrooms",
                storageFormat: storageFormat.Bag,
                storageLocation: storageLocation.Refrigerator,
                measurement: foodMeasurement.count,
                capacity: 3,
                containersOnHand: 1,
                expiration: this.getRandomDebugExpiration(),
                foodCategories: [foodCategory.Produce],
            }
        ];

        for(let i = 0; i < items.length; i++) {
            this.addItem(new InventoryItemModel(items[i], this.getUID()));
        }
    }

    getRandomDebugExpiration(): Date {
        const willAdd: boolean = Math.random() > 0.2 ? true : false;
        const toModify: number = (Math.floor(Math.random() * 100)) / 3;
        let date = moment();
        if(willAdd) {
            return date.add(toModify, 'days').toDate();
        } else {
            return date.subtract(toModify, 'days').toDate();
        }
    }

    getItem(itemId: string): IInventoryItemModel {
        if(this.currentInventoryItems.has(itemId)) {
            return this.currentInventoryItems.get(itemId);
        } else {
            console.error("InventoryStore.getItem - Tried to get item that doesn't exist: " + itemId);
        }
    }

    itemExists(itemId: string): boolean {
        if(!this.currentInventoryItems) this.init();
        
        return this.currentInventoryItems.has(itemId);
    }

    stringToNumValidate(input: string): string | number {
        // validate and set decimal strings to numbers
        const validChars:Array<string> = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'];
                
        if (input !== undefined && input.length > 0) {
            const charArray: string[] = [...input];
            // validate all chars
            if(!charArray.every((char) => validChars.indexOf(char) > -1)) {
                return "";
            }
            const decimalIndex = input.indexOf('.');
            if(decimalIndex >= 0) {
                if(input.length - (decimalIndex + 1) > 2) {
                    return " Numbers After Decimal Point";
                }
            }
            
            // valid, set the number in data
            return +input;
        } else {
            return "";
        }
    }

    // returns empty string when valid
    @action
    validateAndConvertDecimals(itemData:IInventoryItemModel): string {
        // these are the minimum fields required to build an item ID
        if(itemData.food === undefined || itemData.food.length < 1) {
            return "Product Name";
        } else if (itemData.measurement < 0) {
            return "Measurement";
        } else if (itemData.storageFormat < 0 && itemData.measurement !== foodMeasurement.count) {
            return "Format";
        } else if (itemData.storageLocation < 0) {
            return "Location";
        }
        
        const validatedOnHand: any = this.stringToNumValidate(itemData.containersOnHand?.toString());
        if(typeof validatedOnHand === "number") {
            itemData.containersOnHand = validatedOnHand;
        } else { // string
            return "On Hand" + validatedOnHand as string;
        }
        const validatedCapacity = this.stringToNumValidate(itemData.capacity?.toString());
        if(typeof validatedCapacity === "number") {
            itemData.capacity = validatedCapacity;
        }

        return "";
    }

    areIdsEqual(A:IInventoryItemModel, B:IInventoryItemModel): boolean {
        if(
            A.brand !== B.brand ||
            A.variety !== B.variety ||
            A.food !== B.food ||
            A.measurement !== B.measurement ||
            A.capacity !== B.capacity ||
            A.storageFormat !== B.storageFormat ||
            A.storageLocation !== B.storageLocation ||
            A.expiration !== B.expiration
        ) {
            return false;
        }

        return true;
    }

}