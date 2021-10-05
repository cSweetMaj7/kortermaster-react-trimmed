import moment from 'moment';
import { observable, action, computed } from 'mobx';
import { TextUtils } from '../../utils/Text';
import { InventoryEntry } from './InventoryEntry';
import { serializable, identifier, date, primitive, list, createModelSchema } from 'serializr';

export enum foodCategory { // all catergories includes their substitutes
    Other,
    Alcochols, // beer, wine
    Baby_Food,
    Baking, // any product commonly used for baking (non sugar) flour, baking soda/powder, mixes
    Beverages, // drinks, juice, non-alcoholic
    Breads,
    Canned,
    Cheeses,
    Coffee,
    Confectionaries, // covers sugar, chocolate, candy, desserts, honey, syrup, cakes
    Dried,
    Eggs,
    Fruits,
    Grains_and_Cereals,
    Ice,
    Legumes, // beans and lentils!
    Meats, // covers all meats, metadata determined by name
    Milks_and_Creams, // creams, cow, goat, almond, rice, etc...
    Nuts_and_Seeds,
    Oils, // covers butter, ghee, olive oil, lard, etc
    Pastas, // includes noodles
    Pet_Foods,
    Prepared, // covers anything that requires little to no preparation like chips, instant noodles, frozen meals
    Preserves, // jams, jellies, fruits, usually sealed glass jars
    Sauces, // includes condiments, dressings
    Seasonings, // covers salt, pepper, herbs, spices
    Tea,
    Vegetables,
    Vinegars,
    Yogurts
}

export enum foodMeasurement {
    oz, // ounce
    lb, // pound
    fl_oz, // fluid ounce
    gal, // gallon
    g, // gram
    count // individual count
}

export enum storageFormat {
    Bag,
    Barrel,
    Basket,
    Blister,
    Block,
    Bottle,
    Box,
    Bucket,
    Carton,
    Can,
    Case,
    Crate,
    Flat,
    Grinder,
    Jar,
    Jug,
    Log,
    Other,
    Packet,
    Pallet,
    Roll,
    Spool,
    Tray,
    Tub,
    Tube,
    Wrapper
}

export enum storageLocation {
    Pantry,
    Refrigerator,
    Freezer,
    Storage,
    Travel
}

export interface IInventoryItemModel {
    food: string;
    measurement: foodMeasurement;
    capacity: number;
    storageFormat: storageFormat;
    storageLocation: storageLocation;
    containersOnHand: number;
    foodCategories: foodCategory[];
    id?: string;
    brand?: string;
    variety?: string;
    expiration?: Date;
    lastUpdated?: Date;
}

export interface ICategoryIndex {
    id: string,
    name: string
}

class CategoryIndex implements ICategoryIndex {
    id: ''
    name: ''
}

createModelSchema(CategoryIndex, {
    id: primitive(),
    name: primitive()
});

export class InventoryItemModel implements IInventoryItemModel {

    @serializable(identifier())
    id: string;

    @serializable(primitive())
    @observable
    brand: string;

    @serializable(primitive())
    @observable
    variety: string;

    @serializable(primitive())
    @observable
    food: string;

    @serializable(primitive())
    @observable
    measurement: foodMeasurement;

    @serializable(primitive())
    @observable
    capacity: number;

    @serializable(primitive())
    @observable
    storageFormat: storageFormat;

    @serializable(primitive())
    @observable
    storageLocation: storageLocation;

    @serializable(date())
    @observable
    expiration: Date | undefined;

    @serializable(date())
    @observable
    lastUpdated: Date;

    // additional identifiers either change or aren't used to make this item unique
    @serializable(primitive())
    @observable
    containersOnHand: number;

    @serializable(list(primitive()))
    @observable
    foodCategories: foodCategory[];

    constructor(inventoryItem: IInventoryItemModel | InventoryEntry | undefined, UID: string) {
        this.update(inventoryItem, UID);
    }

    @action
    update(inventoryItem: IInventoryItemModel | InventoryEntry | undefined, UID: string) {
        if(inventoryItem === undefined) {
            // defaults
            this.brand = "";
            this.variety = "";
            this.food = "";
            this.measurement = 0;
            this.capacity = 0;
            this.storageFormat = 0;
            this.storageLocation = 0;
            this.expiration = moment().toDate();
            this.containersOnHand = 0;
            this.foodCategories = [];
        } else {
            Object.assign(this, inventoryItem);
        }
        this.id = this.makeId(UID);
    }

    private makeId(UID: string): string {
        //{UID}.{brand}.{variety}.{food}.{category}.{measurement}.{capacity}.{storageFormat}.{storageLocation}.{expiration}
        const properties: string[] = [];
        
        properties.push(UID);

        if(!this.brand || this.brand.length < 1) {
            this.brand = 'brandless';   
        }
        properties.push(this.brand);

        if(!this.variety || this.variety.length < 1) {
            this.variety = 'plain';
        }
        properties.push(this.variety);

        properties.push(this.food);

        if(this.foodCategories?.length > 0) {
            properties.push(this.foodCategories[0].toString())
        } else {
            properties.push("uncategorized");
        }
        
        if(this.capacity) {
            properties.push(this.capacity.toString());
        }
        properties.push(TextUtils.foodMeasurement(this.measurement, true, 1));
        
        if(this.storageFormat) {
            properties.push(TextUtils.storageFormat(this.storageFormat, 1));
        }
        properties.push(TextUtils.storageLocation(this.storageLocation));
        properties.push(moment(this.expiration).format(TextUtils.defaultDateFormat));
        
        return properties.join('.')
            .toLowerCase()
            .replace(" ", "_");
    }

}