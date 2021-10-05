import { Alert } from 'react-native';
import { injectable, inject } from 'inversify';
import { InjectableBase } from '../../../InjectableBase';
import { DomainTypes, ServiceTypes } from '../../../Types';
import { ILoggingService } from '../../services/LoggingService';

export interface IAlertConfig {
    name: string,
    title: string,
    message: string,
    buttons: Object[],
    options: Object
}

export interface IAlertsStore {
    displayAlertByName(alertName: string): void
}

@injectable()
export class AlertsStore extends InjectableBase implements IAlertsStore {
    private alertMap: Map<string, IAlertConfig>;

    private alertList:IAlertConfig[] = [
        {
            name: "CapacityHelp",
            title: "What's Capacity?",
            message: `Capacity is the total number of units the product container holds. You can find this printed on the front label of the product. When the "Count" Measurement is used this field is disabled.`,
            buttons: [{text: "More Help" }, { text: "OK" }],
            options: { cancelable: false }
        },
        {
            name: "MeasurementHelp",
            title: "What's Measurement?",
            message: "Measurement is the unit of measurement printed next to the capacity. Measurements are usually in Ounces for solids and Fluid Ounces for liquids. Use the Count measurement to track by the total number of items you have. This is useful for products like eggs and proudce.",
            buttons: [{text: "More Help" }, { text: "OK" }],
            options: { cancelable: false }
        },
        {
            name: "FormatHelp",
            title: "What's Format?",
            message: `Format refers to the type of container that holds the product or the way in which a product is sold. When the "Count" Measurement is used this field is disabled.`,
            buttons: [{text: "More Help" }, { text: "OK" }],
            options: { cancelable: false }
        },
        {
            name: "BrandnameHelp",
            title: "What's Brand Name?",
            message: "Brand Name is the name of the company who manufactured the product.",
            buttons: [{text: "More Help" }, { text: "OK" }],
            options: { cancelable: false }
        },
        {
            name: "VarietyHelp",
            title: "What's Variety?",
            message: `Variety describes what makes this product different from similar products. For example, "Russet" is a variety of Potato and "Apple" is a variety of Juice. This should be two or three words maximum.`,
            buttons: [{text: "More Help" }, { text: "OK" }],
            options: { cancelable: false }
        },
        {
            name: "FoodHelp",
            title: "What's Product Name?",
            message: `Product Name is the most basic way to describe a product. "Butter", "Oil", and "Beef" are examples of Product Names. This should be two or three words maximum.`,
            buttons: [{text: "More Help" }, { text: "OK" }],
            options: { cancelable: false }
        },
        {
            name: "StorageHelp",
            title: "What's Storage?",
            message: `Storage Location lets you easily keep track of where your product is kept by placing a corresponding Icon on your Inventory Card.`,
            buttons: [{text: "More Help" }, { text: "OK" }],
            options: { cancelable: false }
        },
        {
            name: "OnhandHelp",
            title: "What's On Hand?",
            message: `This refers to the number of containers of product you physically have. Enter a decimal if some of a product has been used, but not all of it. When you use the "Count" Measurement, this refers to the total number of units of product you have.`,
            buttons: [{text: "More Help" }, { text: "OK" }],
            options: { cancelable: false }
        },
        {
            name: "ExpirationHelp",
            title: "What's Expiration?",
            message: `Most products have an expiration date printed on them. Enter it here. You should adjust your expiration when storing products in the Freezer. If your product has no provided expiration one will be suggested based on category.`,
            buttons: [{text: "More Help" }, { text: "OK" }],
            options: { cancelable: false }
        },
        {
            name: "CategoryHelp",
            title: "What's Category?",
            message: `Place products in a category of your choosing to help keep organized. Each product category marks your Inventory Card with a unique Icon and Color corresponding to the category.`,
            buttons: [{text: "More Help" }, { text: "OK" }],
            options: { cancelable: false }
        }
    ]

    constructor(@inject(ServiceTypes.Logging) private localStorageService: ILoggingService) {
        super(DomainTypes.Alerts);
        this.awaitDependenciesAndInit(arguments);
      }

    protected async init(): Promise<void> {
        this.alertMap = new Map<string, IAlertConfig>();

        for(let i = 0; i < this.alertList.length; i++) {
            this.alertMap.set(this.alertList[i].name, this.alertList[i]);
        }
    }

    displayAlertByName(alertName: string): void {
        if(this.alertMap.has(alertName)) {
            const alertData = this.alertMap.get(alertName);
            this.alertFromData(alertData);
        } else {
            console.warn("Alert " + alertName + " doesn't exist.");
        }
    }

    private alertFromData(data: IAlertConfig) {
        Alert.alert(data.title, data.message, data.buttons, data.options);
    }
}