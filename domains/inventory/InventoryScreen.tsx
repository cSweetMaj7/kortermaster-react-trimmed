import { IInventoryStore } from './InventoryStore';
import React, { Component } from "react";
import { StyleSheet, Alert, SafeAreaView } from 'react-native';
import { action, when, observable, runInAction } from 'mobx';
import { observer } from "mobx-react";
import { InventoryEntry } from './InventoryEntry';
import { DomainTypes } from '../../../Types';
import { lazyInject } from '../../../DependencyContainer';
import { InventoryItemModel, foodMeasurement, storageLocation } from './InventoryItemModel';
import { CommonActions } from '@react-navigation/native';
import { IInventoryMetadataStore } from './InventoryMetadataStore';
import moment from 'moment';

interface IProps {
    navigation: any;
    route: any;
};

@observer
export class InventoryScreen extends Component<IProps> {
    @lazyInject(DomainTypes.Inventory) private inventoryStore: IInventoryStore;
    @lazyInject(DomainTypes.InventoryMetadata) private inventoryMetadataStore: IInventoryMetadataStore;
    
    @observable
    private inventoryEntry: InventoryEntry;

    private GTIN:string;

    constructor(props: IProps) {
        super(props);
        if(this.props.route?.params?.editItemId) {
            this.editItem(this.props.route.params.editItemId);
        }
        if (this.props.route?.params?.scannedGTIN) {
            //console.warn("Opening input with scanned GTIN " + this.props.route.params.scannedGTIN);
            this.GTIN = this.props.route.params.scannedGTIN;
        } else {
            //console.warn("No GTIN passed");
        }
    }

    async componentDidMount() {
        if(this.GTIN) {
            const GTIN = await this.inventoryStore.lookupGTIN(this.GTIN);
            if(GTIN) {
                // console.warn("Populating GTIN Data...");
                const brand = this.inventoryStore.getBrandByBSIN(GTIN.BSIN_id);
                // get measurements
                const oz = GTIN.M_OZ;
                const fl_oz = GTIN.M_FLOZ;
                const g = GTIN.M_G;
                let decodedFoodName = GTIN.GTIN_NM ? GTIN.GTIN_NM : "";
                let decodedVarietyName = "";

                const firstPipe = decodedFoodName.indexOf('|');
                const lastPipe = decodedFoodName.lastIndexOf('|');
                if(firstPipe >= 0 && lastPipe >= 0) {
                    // extract the food name from the GTIN name, what remains is the variety
                    const len = lastPipe - firstPipe;
                    const extractedFoodName = decodedFoodName.substr(firstPipe, len + 1);
                    decodedFoodName = decodedFoodName.replace(extractedFoodName, "");
                    decodedVarietyName = decodedFoodName;
                    decodedFoodName = extractedFoodName.substr(1, extractedFoodName.length - 2);
                }

                
                runInAction(() => {
                    this.inventoryEntry.inventoryItem.food = decodedFoodName;
                    this.inventoryEntry.inventoryItem.variety = decodedVarietyName;
                    this.inventoryEntry.inventoryItem.brand = brand ? brand : "";
                    if(oz && oz > 0) {
                        if(oz >= 16){
                            // convert back to pounds
                            this.inventoryEntry.inventoryItem.measurement = foodMeasurement.lb;
                            this.inventoryEntry.inventoryItem.capacity /= 16;
                        } else {
                            this.inventoryEntry.inventoryItem.measurement = foodMeasurement.oz;
                            this.inventoryEntry.inventoryItem.capacity = oz;
                        }
                    } else if (fl_oz && fl_oz > 0) {
                        if(fl_oz >= 128) {
                            this.inventoryEntry.inventoryItem.measurement = foodMeasurement.gal;
                            this.inventoryEntry.inventoryItem.capacity /= 128;
                        } else {
                            this.inventoryEntry.inventoryItem.measurement = foodMeasurement.fl_oz;
                            this.inventoryEntry.inventoryItem.capacity = fl_oz;
                        }
                    } else if (g && g > 0) {
                        this.inventoryEntry.inventoryItem.measurement = foodMeasurement.g;
                        this.inventoryEntry.inventoryItem.capacity = g;
                    }
                    this.inventoryEntry.inventoryItem.storageFormat = GTIN.K_PACKAGE;
                });
                const metaData = await this.inventoryMetadataStore.getMetadataByItem(this.inventoryEntry.inventoryItem);

                if(GTIN.K_CATEGORY) {
                    console.warn("Category from GTIN")
                    runInAction(() => this.inventoryEntry.inventoryItem.foodCategories = [GTIN.K_CATEGORY]);
                } else if(metaData && this.inventoryEntry.inventoryItem.foodCategories?.length == 0) {
                    console.warn("Category from name metadata");
                    this.inventoryStore.shouldAddGTINCache = true;
                    runInAction(() => {
                        this.inventoryEntry.inventoryItem.foodCategories = [metaData.category];
                        switch(this.inventoryEntry.inventoryItem.storageLocation) {
                            case storageLocation.Freezer:
                                this.inventoryEntry.inventoryItem.expiration = moment().add(metaData.averageLifeDaysFreezer, 'days').toDate();
                                break;
                            case storageLocation.Refrigerator:
                                this.inventoryEntry.inventoryItem.expiration = moment().add(metaData.averageLifeDaysFridge, 'days').toDate();
                                break;
                            default:
                                this.inventoryEntry.inventoryItem.expiration = moment().add(metaData.averageLifeDaysPantry, 'days').toDate();
                                break;
                        }
                    });
                }
                if(this.inventoryEntry.inventoryItem.containersOnHand <= 0) {
                    runInAction(() => this.inventoryEntry.inventoryItem.containersOnHand = 1);
                }
            } else {
                // local and cloud cache miss
                this.inventoryStore.shouldAddGTINCache = true;
                this.inventoryEntry.forceUpdate();
            }
        }
    }

    onPressCancel = async () => {
        this.props.navigation.navigate("Inventory");
    }

    onPressRemove = async () => {
        const removeId = this.inventoryEntry.oldRecord.id || this.inventoryEntry.id;
        await this.inventoryStore.removeItem(removeId);
        this.props.navigation.navigate("Inventory");
        this.props.navigation.dispatch((state:any) => {
            // Remove the Edit route from the stack
            const routes = state.routes.filter((r:any) => r.name !== 'Edit');
          
            return CommonActions.reset({
              ...state,
              routes,
              index: routes.length - 1,
            });
        });
    }

    onPressAdd = async (requestGTINUpdate?: false) => {
        console.warn(requestGTINUpdate ? "Requesting GTIN Update" : "Normal Add");
        const validatedEntry = this.inventoryStore.validateAndConvertDecimals(this.inventoryEntry.inventoryItem);
        if( validatedEntry === "") {
            const newEntry = new InventoryItemModel(this.inventoryEntry.inventoryItem, this.inventoryStore.getUID());
            if(this.inventoryEntry.isEditing) {
                // Updating a record. See if changes will result in a new ID
                // TODO move this logic to InventoryStore
                if(newEntry.id === this.inventoryEntry.inventoryItem.id) {
                    // ID will not change, update
                    await this.inventoryStore.updateItem(newEntry);
                    //console.warn("Overwrite " + newEntry.id);
                } else {
                    // new ID is made, remove the old entry and add this one
                    await this.inventoryStore.removeItem(this.inventoryEntry.inventoryItem.id);
                    await this.inventoryStore.addItem(newEntry);
                }
            } else {
                // new entry, just add it
                await this.inventoryStore.addItem(newEntry);
            }

            if(this.inventoryStore.shouldAddGTINCache || requestGTINUpdate) {
                // new item and new GTIN data, create it and add it to the cache
                this.inventoryStore.updateGTINCache(this.GTIN, newEntry, requestGTINUpdate);
                this.inventoryStore.shouldAddGTINCache = false;
            }
            
            console.log(this.inventoryStore.currentInventoryItems);

            this.props.navigation.navigate("Inventory");
        } else {
            Alert.alert(
                `Invalid ${validatedEntry}`,
                "You've left out some valuable details. Please check your entries again!",
                [{ text: "OK", onPress: () => console.log("OK Pressed") }],
                { cancelable: false }
            );
        }
    }

    @action
    async editItem(itemId: string) {
        await when(() => this.inventoryEntry != undefined);
        runInAction(() => this.inventoryEntry.isEditing = true);
        setTimeout(async () => {
            this.inventoryEntry.update(this.inventoryStore.getItem(itemId));
        }, 500);
    }

    render() {
        return (
        <React.Fragment>
            <SafeAreaView
            style={styles.modalContainer}>
                <InventoryEntry
                ref={(component) => runInAction(() => this.inventoryEntry = component)}
                onSubmit={this.onPressAdd}
                onRemove={this.onPressRemove}
                onBack={this.onPressCancel}
                />
            </SafeAreaView>
        </React.Fragment> );
    }
}

const styles = StyleSheet.create({
    addButton: {
      borderRadius: 40,
      backgroundColor: 'pink',
      maxHeight: 40,
      width: 40,
      right: -10
    },
    addText: {
      color: "green",
      fontWeight: "bold",
      fontSize: 50,
      bottom: 3,
      marginLeft: 4,
      lineHeight: 50
    },
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-start',
        backgroundColor: 'grey',
    },
  });