import { injectable } from 'inversify';
import API, { graphqlOperation } from '@aws-amplify/api';
import {IInventoryItemModel} from '../domains/inventory/InventoryItemModel';
import moment from 'moment';
import { IGTIN, GTINItemModel } from '../domains/inventory/GTINItemModel';
import { IItemValidationData } from '../domains/inventory/InventoryStore';

export interface IInventoryService {
    listItems(): Promise<IInventoryItemModel[]>;
    validationItems(): Promise<IItemValidationData[]>;
    addItem(item: IInventoryItemModel): Promise<Date>;
    removeItem(itemId: string): Promise<boolean>;
    updateItem(item: IInventoryItemModel): Promise<Date>;
    getGTIN(GTIN: string): Promise<IGTIN>;
    createGTIN(GTIN: GTINItemModel): Promise<boolean>; // POWER USERS ONLY
    updateGTIN(GTIN: GTINItemModel): Promise<boolean>; // POWER USERS ONLY
}

@injectable()
export class InventoryService implements IInventoryService {

    async updateGTIN(GTIN: GTINItemModel): Promise<boolean> {
        const GTINMutation =
        `
        mutation updateGTIN {
            updateGTIN(input: {
                id: "${GTIN.GTIN_CD}",
                IMG: ${GTIN.IMG},
                M_G: ${GTIN.M_G},
                M_OZ: ${GTIN.M_OZ},
                M_FLOZ: ${GTIN.M_FLOZ},
                BSIN_id: "${!GTIN.BSIN_id ? null : GTIN.BSIN_id}",
                GTIN_NM: "${GTIN.GTIN_NM}",
                GPC_S_CD_id: "${!GTIN.GPC_S_CD_id ? null : GTIN.GPC_S_CD_id}",
                GPC_F_CD_id: "${!GTIN.GPC_F_CD_id ? null : GTIN.GPC_F_CD_id}",
                GPC_C_CD_id: "${!GTIN.GPC_C_CD_id ? null : GTIN.GPC_C_CD_id}",
                GPC_B_CD_id: "${!GTIN.GPC_B_CD_id ? null : GTIN.GPC_B_CD_id}",
                K_PACKAGE: ${GTIN.K_PACKAGE},
                K_CATEGORY: ${GTIN.K_CATEGORY}
                }) {
              id
            }
          }
        `;

        try {
            const response: any = await API.graphql(graphqlOperation(GTINMutation));
            if(response?.data?.updateGTIN?.id) {
                return true;
            } else {
                console.error("InventoryService.updateGTIN Error Response", response);
                return false;
            }
        } catch(error) {
            console.error("InventoryService.getGTIN", error);
        }
    }

    async createGTIN(GTIN: GTINItemModel): Promise<boolean> {
        const GTINMutation =
        `
        mutation CreateGTIN {
            CreateGTIN: createGTIN(input : {
              id: "${GTIN.GTIN_CD}",
              IMG: ${GTIN.IMG},
              M_G: ${GTIN.M_G},
              M_OZ: ${GTIN.M_OZ},
              M_FLOZ: ${GTIN.M_FLOZ},
              BSIN_id: "${!GTIN.BSIN_id ? null : GTIN.BSIN_id}",
              GTIN_NM: "${GTIN.GTIN_NM}",
              GPC_S_CD_id: "${!GTIN.GPC_S_CD_id ? null : GTIN.GPC_S_CD_id}",
              GPC_F_CD_id: "${!GTIN.GPC_F_CD_id ? null : GTIN.GPC_F_CD_id}",
              GPC_C_CD_id: "${!GTIN.GPC_C_CD_id ? null : GTIN.GPC_C_CD_id}",
              GPC_B_CD_id: "${!GTIN.GPC_B_CD_id ? null : GTIN.GPC_B_CD_id}"
              K_PACKAGE: ${GTIN.K_PACKAGE},
              K_CATEGORY: ${GTIN.K_CATEGORY}
            }) {
              id
            }
          }
        `;

        try {
            const response: any = await API.graphql(graphqlOperation(GTINMutation));
            if(response?.data?.CreateGTIN?.id) {
                return true;
            } else {
                console.error("InventoryService.createGTIN Error Response", response);
                return false;
            }
        } catch(error) {
            console.error("InventoryService.createGTIN", error);
        }
    }

    async getGTIN(GTIN: string): Promise<IGTIN> {
        const GTINQuery =
        `
        query getGTIN {
            getGTIN(id: "${GTIN}") {
                id
                IMG,
                M_G,
                M_OZ,
                M_FLOZ,
                BSIN_id,
                GTIN_NM,
                GPC_S_CD_id,
                GPC_F_CD_id,
                GPC_C_CD_id,
                GPC_B_CD_id,
                K_PACKAGE,
                K_CATEGORY
            }
        }
        `

        try {
            const response: any = await API.graphql(graphqlOperation(GTINQuery));
            if(response?.data?.getGTIN?.id) {
                return this.parseGTINs([response.data.getGTIN])[0];
            } else {
                //console.error("getGTIN Error Response", response);
                return null;
            }
        } catch(error) {
            console.error("InventoryService.getGTIN", error);
        }
    }

    async listItems(): Promise<IInventoryItemModel[]> {
        const listItemsQuery = 
        `
        query ListItems {
            listItems(limit:10) {
              items {
                id
                food
                measurement
                capacity
                storageFormat
                storageLocation
                containersOnHand
                foodCategories
                brand
                variety
                expiration
                lastUpdated
              },
              nextToken
            }
          }
        `;
        try {
            let responseItems = [];
            let nextToken;
            let page = 1;
            do {
                const listItemsTokenQuery = 
                `
                query ListItems {
                    listItems(limit:10, nextToken:"${nextToken}") {
                        items {
                            id
                            food
                            measurement
                            capacity
                            storageFormat
                            storageLocation
                            containersOnHand
                            foodCategories
                            brand
                            variety
                            expiration
                            lastUpdated
                        },
                        nextToken
                    }
                }
                `;
                //console.warn("Items Page " + page);
                const response: any = nextToken ? await API.graphql(graphqlOperation(listItemsTokenQuery)) : await API.graphql(graphqlOperation(listItemsQuery));
                nextToken = response.data?.listItems?.nextToken;
                if(response?.data?.listItems?.items?.length > 0) {
                    responseItems = responseItems.concat(response.data.listItems.items);
                } else {
                    //console.error("listItems Error Response", response);
                }
                page++;
            } while(nextToken);

            return this.parseItems(responseItems);
            
        } catch(error) {
            console.error("InventoryService.listItems", error);
        }

        return null;
    }

    async removeItem(itemId: string): Promise<boolean> {
        const removeItemMutation =
        `
        mutation deleteItem {
            deleteItem(input:{id: "${itemId}"}) {
              id
            }
          }
        `;

        try {
            const response: any = await API.graphql(graphqlOperation(removeItemMutation));
            if(response?.data?.deleteItem?.id === itemId) {
                //console.warn("Cloud remove success!")
                return true;
            } else {
                console.error("InventoryService.removeItem Error Response", response);
                return false;
            }
        } catch(error) {
            console.error("InventoryService.removeItem", error);
            return false;
        }
    }

    // returns a timestamp on success, null otherwise
    async updateItem(item: IInventoryItemModel): Promise<Date> {
        const updatedTimestamp = moment().valueOf().toString();
        const updateMutation =
        `
        mutation updateItem {
            updateItem(input: {
              id: "${item.id}",
              containersOnHand: ${item.containersOnHand},
              foodCategories: [ ${item.foodCategories.toString()} ],
              lastUpdated: "${updatedTimestamp}"
            }) {
              containersOnHand,
              foodCategories,
              lastUpdated
            }
          }
        `
        try {
            const response: any = await API.graphql(graphqlOperation(updateMutation));
            // for now just validate up to "updateItem"
            if(response?.data?.updateItem) {
                //console.warn("Cloud update success!")
                return new Date(+updatedTimestamp);
            } else {
                console.error("InventoryService.updateItem Error Response", response);
                return null;
            }
        } catch(error) {
            console.error("InventoryService.updateItem", error);
            return null;
        }
    }

    async validationItems(): Promise<IItemValidationData[]> {
        let responseItems = [];
        const listItemsQuery = 
        `
        query ListItems {
            listItems(limit:10) {
              items {
                id
                lastUpdated
              },
              nextToken
            }
          }
        `;

        let nextToken;
        
        do {
            const listItemsTokenQuery = 
            `
            query ListItems {
                listItems(limit:10, nextToken:"${nextToken}") {
                    items {
                        id
                        lastUpdated
                    },
                    nextToken
                }
            }
            `;

            try {
                const response: any = nextToken ? await API.graphql(graphqlOperation(listItemsTokenQuery)) : await API.graphql(graphqlOperation(listItemsQuery));
                nextToken = response.data?.listItems?.nextToken;
                if(response?.data?.listItems?.items?.length > 0) {
                    responseItems = responseItems.concat(response.data.listItems.items);
                } else {
                    //console.error("validationItems Error Response", response);
                }
            } catch(error) {
                console.error("InventoryService.validationItems", error);
            }
        
        } while(nextToken);

        return this.parseValidationItems(responseItems);
    }

    async addItem(item: IInventoryItemModel): Promise<Date> {
        const updatedTimestamp = moment().valueOf().toString();
        const addItemMutation = 
        `
        mutation CreateItem {
            CreateItem: createItem(input: {
              id:"${item.id}",
              brand: "${item.brand}",
              capacity: ${item.capacity},
              containersOnHand: ${item.containersOnHand},
              expiration: "${item.expiration.valueOf()}",
              food: "${item.food}",
              foodCategories: [${item.foodCategories.toString()}],
              lastUpdated: "${updatedTimestamp}",
              measurement: ${item.measurement},
              storageFormat: ${item.storageFormat},
              storageLocation: ${item.storageLocation},
              variety: "${item.variety}"
            }) {
              id
            }
          }
        `;

        try {
            const response: any = await API.graphql(graphqlOperation(addItemMutation));
            if(response?.data?.CreateItem?.id === item.id) {
                //console.warn("Cloud create success!");
                return new Date(+updatedTimestamp);
            } else {
                console.error("InventoryService.addItem Error Response", response);
                return null;
            }
        } catch(error) {
            console.error("InventoryService.addItem", error);
            return null;
        }
    }

    parseValidationItems(items: any[]): IItemValidationData[] {
        const result: IItemValidationData[] =[];

        for(let i = 0; i < items.length; i++) {
            const responseItem: any = items[i];
            const validationItem: IItemValidationData = {
                id: responseItem.id,
                lastUpdated: moment(+responseItem.lastUpdated).toDate()
            }
            result.push(validationItem);
        }

        return result;
    }

    parseGTINs(GTINs: any[]): IGTIN[] {
        const result: IGTIN[] = [];

        for(let i = 0; i < GTINs.length; i++) {
            const responseItem: any = GTINs[i];
            const GTINItem: IGTIN = {
                GTIN_CD: responseItem.id,
                IMG: responseItem.IMG,
                M_G: responseItem.M_G,
                M_OZ: responseItem.M_OZ,
                M_FLOZ: responseItem.M_FLOZ,
                BSIN_id: responseItem.BSIN_id,
                GTIN_NM: responseItem.GTIN_NM,
                GPC_S_CD_id: responseItem.GPC_S_CD_id,
                GPC_F_CD_id: responseItem.GPC_F_CD_id,
                GPC_C_CD_id: responseItem.GPC_C_CD_id,
                GPC_B_CD_id: responseItem.GPC_B_CD_id,
                K_PACKAGE: responseItem.K_PACKAGE,
                K_CATEGORY: responseItem.K_CATEGORY
            };
            result.push(GTINItem);
        }
        
        return result;
    }

    parseItems(items: any[]): IInventoryItemModel[] {
        const result: IInventoryItemModel[] = [];

        // just a little tweaking to make these our real models again
        for(let i = 0; i < items.length; i++) {
            const responseItem: any = items[i];
            const inventoryItem: IInventoryItemModel = {
                id: responseItem.id,
                brand: responseItem.brand,
                variety: responseItem.variety,
                food: responseItem.food,
                measurement: responseItem.measurement,
                capacity: responseItem.capacity,
                storageFormat: responseItem.storageFormat,
                storageLocation: responseItem.storageLocation,
                containersOnHand: responseItem.containersOnHand,
                foodCategories: responseItem.foodCategories as Array<number>,
                expiration: moment(+responseItem.expiration).toDate(),
                lastUpdated: moment(+responseItem.lastUpdated).toDate()
            };
            result.push(inventoryItem);
        }
        
        return result;
    }

}