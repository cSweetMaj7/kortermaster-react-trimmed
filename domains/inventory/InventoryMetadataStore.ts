import { injectable, inject } from "inversify";
import { IInventoryItemModel, foodCategory} from './InventoryItemModel';
import { TextUtils } from "../../utils/Text";
import moment from 'moment';
import { InjectableBase } from "../../../InjectableBase";
import { DomainTypes, ServiceTypes } from '../../../Types';
import { ILoggingService } from '../../services/LoggingService';
import { when } from "mobx";
import { Text } from "react-native-elements";

export interface IItemMetadata {
    name: string,
    symbol: string,
    backgroundColor: string,
    borderColor: string,
    match?: string[],
    averageLifeDaysPantry?: number,
    averageLifeDaysFridge?: number,
    averageLifeDaysFreezer?: number,
    useSoonDaysThreshold?: number,
    useOrDiscardSoonDaysThreshold?: number,
    category?: foodCategory
}

export interface IShelfLifeMetadata {
    name: string,
    symbol: string,
    color: string,
    expiresInMessage?: string
}

export interface IInventoryMetadataStore {
    getMetadataByName(name: string): IItemMetadata,
    getMetadataByItem(item: IInventoryItemModel): Promise<IItemMetadata>,
    getCategorySymbol(foodCategory: foodCategory | undefined): string,
    getCategoryColor(foodCategory: foodCategory | undefined): string,
    getShelfLifeMetadataByItem(item: IInventoryItemModel): Promise<IShelfLifeMetadata>,
    getDaysSinceUpdated(lastUpdated: Date):number
}

@injectable()
export class InventoryMetadataStore extends InjectableBase implements IInventoryMetadataStore {

    metaDataNameDictionary = new Map<string, IItemMetadata>();
    metaDataMatchDictionary = new Map<string, IItemMetadata>();
    shelfLifeNameDictionary = new Map<string, IShelfLifeMetadata>();

    dictionaryEntry:IItemMetadata[] = [];

    constructor(@inject(ServiceTypes.Logging) private localStorageService: ILoggingService) {
        super(DomainTypes.InventoryMetadata);
        this.awaitDependenciesAndInit(arguments);
      }

    protected async init(): Promise<void> {
        // build maps
        this.metaDataNameDictionary = new Map<string, IItemMetadata>();
        this.metaDataMatchDictionary = new Map<string, IItemMetadata>();
        for(let i = 0; i < this.itemMetaData.length; i++) {
            const item = this.itemMetaData[i];
            this.metaDataNameDictionary.set(item.name, item);
            this.metaDataNameDictionary.set(item.name + 's', item); // standard pluarization
            if(item.match) {
                for(let j = 0; j < item.match.length; j++) {
                    this.metaDataMatchDictionary.set(item.match[j], item);
                    this.metaDataMatchDictionary.set(item.match[j] + 's', item); // standard pluralization
                }
            }
        }
        this.shelfLifeNameDictionary = new Map<string, IShelfLifeMetadata>();
        for(let k = 0; k < this.shelfLifeMetaData.length; k++) {
            const item = this.shelfLifeMetaData[k];
            this.shelfLifeNameDictionary.set(item.name, item);
        }
    }

    private shelfLifeMetaData: IShelfLifeMetadata[] = [
        {
            name: "Fresh",
            symbol: "",
            color: "green"
        },
        {
            name: "Use Soon",
            symbol: "⏳",
            color: "yellow"
        },
        {
            name: "Use or Discard Soon",
            symbol: "⌛",
            color: "orange"
        },
        {
            name: "Discard",
            symbol: "🤢",
            color: "red"
        },
    ]

    private itemMetaData: IItemMetadata[] = [
        {
            name: "other",
            symbol: "🍲",
            backgroundColor: "#f7f7f7",
            borderColor: "#000000",
            averageLifeDaysFreezer: 90,
            averageLifeDaysFridge: 14,
            averageLifeDaysPantry: 7,
            useSoonDaysThreshold: 7,
            useOrDiscardSoonDaysThreshold: 14,
            category: foodCategory.Other
        }, {
            name: "pizza",
            symbol: "🍕",
            backgroundColor: "#fffa96",
            borderColor: "#fc3d3d",
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 30,
            averageLifeDaysPantry: 2,
            useSoonDaysThreshold: 5,
            useOrDiscardSoonDaysThreshold: 3,
            category: foodCategory.Prepared
        }, {
            name: "eggs",
            symbol: "🥚",
            backgroundColor: "#f0e548",
            borderColor: "#8f8f8f",
            match: ["egg"],
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 30,
            averageLifeDaysPantry: 7,
            useSoonDaysThreshold: 3,
            useOrDiscardSoonDaysThreshold: 14,
            category: foodCategory.Eggs
        }, {
            name: "tortilla",
            symbol: "🌮",
            backgroundColor: "#fff89c",
            borderColor: "#b0964f",
            match: [ "tostada" ],
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 30,
            averageLifeDaysPantry: 7,
            useSoonDaysThreshold: 3,
            useOrDiscardSoonDaysThreshold:  7,
            category: foodCategory.Breads
        }, {
            name: "confectionaries",
            symbol: "🍭",
            backgroundColor: "white",
            borderColor: "#a03cd6",
            match: [ "sweetener", "candy", "candied", "treacle", "molases", "caramel", "ice cream", "popcicle", "sugar", "marshmallow", "graham cracker", "white chocolate" ],
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 365,
            averageLifeDaysPantry: 365,
            useSoonDaysThreshold: 30,
            useOrDiscardSoonDaysThreshold: 60,
            category: foodCategory.Confectionaries
        }, /*{
            name: "ice",
            symbol: "🧊",
            backgroundColor: "#a7d2eb",
            borderColor: "white",
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 365,
            averageLifeDaysPantry: 365,
            useSoonDaysThreshold: 365,
            useOrDiscardSoonDaysThreshold: 365,
            category: foodCategory.Ice
        },*/ {
            name: "coffee",
            symbol: "☕",
            backgroundColor: "#9e835a",
            borderColor: "#594425",
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 60,
            averageLifeDaysPantry: 30,
            useSoonDaysThreshold: 14,
            useOrDiscardSoonDaysThreshold: 60,
            category: foodCategory.Coffee
        }, {
            name: "tea",
            symbol: "☕",
            backgroundColor: "#fff8d9",
            borderColor: "#258a4d",
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 60,
            averageLifeDaysPantry: 30,
            useSoonDaysThreshold: 14,
            useOrDiscardSoonDaysThreshold: 60,
            category: foodCategory.Tea
        }, {
            name: "beverages",
            symbol: "🥤",
            backgroundColor: "#e0e0e0",
            borderColor: "#ff383b",
            match: ["beverage", "juice", "drink", "soda", "pop", "cola", "coke", "kombucha"],
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 90,
            averageLifeDaysPantry: 60,
            useSoonDaysThreshold: 14,
            useOrDiscardSoonDaysThreshold: 60,
            category: foodCategory.Beverages
        }, {
            name: "preserves",
            symbol: "🍯",
            backgroundColor: "#f0e573",
            borderColor: "#8a8120",
            match: [ "preserve", "honey", "syrup", "jam", "jelly", "glaze" ],
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 365,
            averageLifeDaysPantry: 365,
            useSoonDaysThreshold: 30,
            useOrDiscardSoonDaysThreshold: 365,
            category: foodCategory.Preserves
        }, {
            name: "dried",
            symbol: "♨",
            backgroundColor: "#f5ab7a",
            borderColor: "#8f8f8f",
            match: [ "jerky", "jerkey" ],
            averageLifeDaysFreezer: 365 * 2,
            averageLifeDaysFridge: 365,
            averageLifeDaysPantry: 365,
            useSoonDaysThreshold: 30,
            useOrDiscardSoonDaysThreshold: 60,
            category: foodCategory.Dried
        }, {
            name: "pie",
            symbol: "🥧",
            backgroundColor: "#f2cb5c",
            borderColor: "#856f31",
            match: ["pastry", "pastries", "danish"],
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 30,
            averageLifeDaysPantry: 5,
            useSoonDaysThreshold: 2,
            useOrDiscardSoonDaysThreshold: 7,
            category: foodCategory.Confectionaries
        }, {
            name: "cookie",
            symbol: "🍪",
            backgroundColor: "#ba9c47",
            borderColor: "#7d6b38",
            match: ["wafer", "biscuit"],
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 30,
            averageLifeDaysPantry: 10,
            useSoonDaysThreshold: 2,
            useOrDiscardSoonDaysThreshold: 7,
            category: foodCategory.Confectionaries
        }, {
            name: "cake",
            symbol: "🍰",
            backgroundColor: "#f5f395",
            borderColor: "#d143ca",
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 30,
            averageLifeDaysPantry: 5,
            useSoonDaysThreshold: 2,
            useOrDiscardSoonDaysThreshold: 7,
            category: foodCategory.Confectionaries
        }, {
            name: "chocolate",
            symbol: "🍫",
            backgroundColor: "#bd8f62",
            borderColor: "#75502b",
            match: [ "cocoa", "cacao", "fudge"],
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 365,
            averageLifeDaysPantry: 365 / 2,
            useSoonDaysThreshold: 14,
            useOrDiscardSoonDaysThreshold: 90,
            category: foodCategory.Confectionaries
        }, {
            name: "oyster",
            symbol: "🦪",
            backgroundColor: "#ababab",
            borderColor: "#99895c",
            match: [ "mussel", "clam", "scallop"],
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 14,
            averageLifeDaysPantry: 2,
            useSoonDaysThreshold: 1,
            useOrDiscardSoonDaysThreshold: 3,
            category: foodCategory.Meats
        }, {
            name: "butter",
            symbol: "🧈",
            backgroundColor: "#fcffc2",
            borderColor: "#77cae0",
            averageLifeDaysFreezer: 365 * 2,
            averageLifeDaysFridge: 30 * 9,
            averageLifeDaysPantry: 30,
            useSoonDaysThreshold: 7,
            useOrDiscardSoonDaysThreshold: 30,
            category: foodCategory.Oils
        }, {
            name: "mushroom",
            symbol: "🍄",
            backgroundColor: "#f5dcce",
            borderColor: "#6e6e6e",
            match: ["yeast", "truffle", "fungus", "fungi", "crimini", "shitake", "shiitake", "portobello", "enoki", "porcini", "chanterelle"],
            averageLifeDaysFreezer: 30 * 8,
            averageLifeDaysFridge: 7,
            averageLifeDaysPantry: 1,
            useSoonDaysThreshold: 2,
            useOrDiscardSoonDaysThreshold: 7,
            category: foodCategory.Vegetables
        }, {
            name: "onion",
            symbol: "🧅",
            backgroundColor: "#fff8bd",
            borderColor: "#d9c948",
            averageLifeDaysFreezer: 8 * 30,
            averageLifeDaysFridge: 60,
            averageLifeDaysPantry: 30,
            useSoonDaysThreshold: 7,
            useOrDiscardSoonDaysThreshold: 7,
            category: foodCategory.Vegetables
        }, {
            name: "garlic",
            symbol: "🧄",
            backgroundColor: "#fff8bd",
            borderColor: "#d9c948",
            match: [ "shallot" ],
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 365 / 2,
            averageLifeDaysPantry: 30 * 5,
            useSoonDaysThreshold: 14,
            useOrDiscardSoonDaysThreshold: 14,
            category: foodCategory.Vegetables
        }, {
            name: "broccoli",
            symbol: "🥦",
            backgroundColor: "#bceb71",
            borderColor: "#4ac748",
            match: [ "squash" ],
            averageLifeDaysFreezer: 30 * 8,
            averageLifeDaysFridge: 5,
            averageLifeDaysPantry: 0,
            useSoonDaysThreshold: 2,
            useOrDiscardSoonDaysThreshold: 3,
            category: foodCategory.Vegetables
        }, {
            name: "pumpkin",
            symbol: "🎃",
            backgroundColor: "#fcb36a",
            borderColor: "#3d3d3d",
            match: [ "squash" ],
            averageLifeDaysFreezer: 30 * 8,
            averageLifeDaysFridge: 3,
            averageLifeDaysPantry: 30,
            useSoonDaysThreshold: 2,
            useOrDiscardSoonDaysThreshold: 5,
            category: foodCategory.Vegetables
        }, {
            name: "cucumber",
            symbol: "🥒",
            backgroundColor: "#c5fc8d",
            borderColor: "#6fb528",
            match: [ "zucchini", "pickle", "relish" ],
            averageLifeDaysFreezer: 30 * 8,
            averageLifeDaysFridge: 5,
            averageLifeDaysPantry: 7,
            useSoonDaysThreshold: 2,
            useOrDiscardSoonDaysThreshold: 5,
            category: foodCategory.Vegetables
        }, {
            name: "pepper",
            symbol: "🌶",
            backgroundColor: "#e66060",
            borderColor: "#5ad442",
            match: [ "jalapeno", "chile", "habanero", "poblano", "scotch bonnet", "ancho" ],
            averageLifeDaysFreezer: 30 * 8,
            averageLifeDaysFridge: 14,
            averageLifeDaysPantry: 7,
            useSoonDaysThreshold: 2,
            useOrDiscardSoonDaysThreshold: 7,
            category: foodCategory.Vegetables
        }, {
            name: "corn",
            symbol: "🌽",
            backgroundColor: "#fffd9c",
            borderColor: "#62d158",
            match: [ "maize" ],
            averageLifeDaysFreezer: 30 * 8,
            averageLifeDaysFridge: 14,
            averageLifeDaysPantry: 3,
            useSoonDaysThreshold: 2,
            useOrDiscardSoonDaysThreshold: 5,
            category: foodCategory.Vegetables
        }, {
            name: "carrot",
            symbol: "🥕",
            backgroundColor: "#ffc773",
            borderColor: "#7ddb65",
            averageLifeDaysFreezer: 30 * 8,
            averageLifeDaysFridge: 14 * 4,
            averageLifeDaysPantry: 3,
            useSoonDaysThreshold: 3,
            useOrDiscardSoonDaysThreshold: 7,
            category: foodCategory.Vegetables
        }, {
            name: "potato",
            symbol: "🥔",
            backgroundColor: "#d1b977",
            borderColor: "#947c3b",
            match: [ "potatoes" ],
            averageLifeDaysFreezer: 30 * 8,
            averageLifeDaysFridge: 30 * 3,
            averageLifeDaysPantry: 14,
            useSoonDaysThreshold: 3,
            useOrDiscardSoonDaysThreshold: 7,
            category: foodCategory.Vegetables
        }, {
            name: "eggplant",
            symbol: "🍆",
            backgroundColor: "#d080ff",
            borderColor: "#812db3",
            averageLifeDaysFreezer: 30 * 6,
            averageLifeDaysFridge: 10,
            averageLifeDaysPantry: 2,
            useSoonDaysThreshold: 2,
            useOrDiscardSoonDaysThreshold: 4,
            category: foodCategory.Vegetables
        }, {
            name: "avocado",
            symbol: "🥑",
            backgroundColor: "#b8ff91",
            borderColor: "#508a30",
            averageLifeDaysFreezer: 30 * 6,
            averageLifeDaysFridge: 5,
            averageLifeDaysPantry: 4,
            useSoonDaysThreshold: 3,
            useOrDiscardSoonDaysThreshold: 6,
            category: foodCategory.Vegetables
        }, {
            name: "coconut",
            symbol: "🥥",
            backgroundColor: "white",
            borderColor: "#916540",
            averageLifeDaysFreezer: 30 * 6,
            averageLifeDaysFridge: 7,
            averageLifeDaysPantry: 30,
            useSoonDaysThreshold: 4,
            useOrDiscardSoonDaysThreshold: 8,
            category: foodCategory.Fruits
        }, {
            name: "tomato",
            symbol: "🍅",
            backgroundColor: "#ff7d7d",
            borderColor: "#56db44",
            match: [ "tomatoes", "ketchup" ],
            averageLifeDaysFreezer: 30 * 6,
            averageLifeDaysFridge: 7,
            averageLifeDaysPantry: 2,
            useSoonDaysThreshold: 2,
            useOrDiscardSoonDaysThreshold: 7,
            category: foodCategory.Vegetables
        }, {
            name: "kiwi",
            symbol: "🥝",
            backgroundColor: "#d2ff96",
            borderColor: "#b58b43",
            averageLifeDaysFreezer: 30 * 6,
            averageLifeDaysFridge: 7 * 4,
            averageLifeDaysPantry: 7,
            useSoonDaysThreshold: 4,
            useOrDiscardSoonDaysThreshold: 7,
            category: foodCategory.Fruits
        }, {
            name: "strawberry",
            symbol: "🍓",
            backgroundColor: "#ff6969",
            borderColor: "#34eb37",
            match: [ "berry", "berries", "strawberries"],
            averageLifeDaysFreezer: 30 * 6,
            averageLifeDaysFridge: 7,
            averageLifeDaysPantry: 2,
            useSoonDaysThreshold: 3,
            useOrDiscardSoonDaysThreshold: 5,
            category: foodCategory.Fruits
        }, {
            name: "cherry",
            symbol: "🍒",
            backgroundColor: "#ff8c8c",
            borderColor: "#42d442",
            match: [ "cherries" ],
            averageLifeDaysFreezer: 30 * 6,
            averageLifeDaysFridge: 30,
            averageLifeDaysPantry: 7,
            useSoonDaysThreshold: 4,
            useOrDiscardSoonDaysThreshold: 7,
            category: foodCategory.Fruits
        }, {
            name: "peach",
            symbol: "🍑",
            backgroundColor: "#ffe2a3",
            borderColor: "#6fde74",
            match:[ "peaches" ],
            averageLifeDaysFreezer: 30 * 6,
            averageLifeDaysFridge: 5,
            averageLifeDaysPantry: 3,
            useSoonDaysThreshold: 2,
            useOrDiscardSoonDaysThreshold: 5,
            category: foodCategory.Fruits
        }, {
            name: "pear",
            symbol: "🍐",
            backgroundColor: "#e2ffad",
            borderColor: "#e1e376",
            averageLifeDaysFreezer: 30 * 8,
            averageLifeDaysFridge: 10,
            averageLifeDaysPantry: 3,
            useSoonDaysThreshold: 2,
            useOrDiscardSoonDaysThreshold: 5,
            category: foodCategory.Fruits
        }, {
            name: "fruits",
            symbol: "🍎", // default fruit icon
            backgroundColor: "#e05151",
            borderColor: "#78d95b",
            match: [ "apple", 'fruit' ],
            averageLifeDaysFreezer: 30 * 6,
            averageLifeDaysFridge: 21,
            averageLifeDaysPantry: 7,
            useSoonDaysThreshold: 4,
            useOrDiscardSoonDaysThreshold: 7,
            category: foodCategory.Fruits
        }, {
            name: "mango",
            symbol: "🥭",
            match: ["mangoes"],
            backgroundColor: "#f0a630",
            borderColor: "#a4d95b",
            averageLifeDaysFreezer: 30 * 6,
            averageLifeDaysFridge: 7,
            averageLifeDaysPantry: 2,
            useSoonDaysThreshold: 3,
            useOrDiscardSoonDaysThreshold: 5,
            category: foodCategory.Fruits
        }, {
            name: "pineapple",
            symbol: "🍍",
            backgroundColor: "#fcea72",
            borderColor: "#c7ff87",
            averageLifeDaysFreezer: 30 * 6,
            averageLifeDaysFridge: 5,
            averageLifeDaysPantry: 5,
            useSoonDaysThreshold: 3,
            useOrDiscardSoonDaysThreshold: 7,
            category: foodCategory.Fruits
        }, {
            name: "banana",
            symbol: "🍌",
            backgroundColor: "#eded85",
            borderColor: "#ba993d",
            match: ["plantain"],
            averageLifeDaysFreezer: 30 * 6,
            averageLifeDaysFridge: 21,
            averageLifeDaysPantry: 7,
            useSoonDaysThreshold: 3,
            useOrDiscardSoonDaysThreshold: 7,
            category: foodCategory.Fruits
        }, {
            name: "lemon",
            symbol: "🍋",
            backgroundColor: "#fdffa3",
            borderColor: "#46db5f",
            match: ["citron", "bhuddha's hand", "calamondin", "lime", "etrog", "kabosu", "oroblanco", "papeda", "pomelo", "shonan", "limetta", "yuzu"],
            averageLifeDaysFreezer: 30 * 6,
            averageLifeDaysFridge: 7 * 4,
            averageLifeDaysPantry: 14,
            useSoonDaysThreshold: 5,
            useOrDiscardSoonDaysThreshold: 10,
            category: foodCategory.Fruits
        }, {
            name: "orange",
            symbol: "🍊",
            backgroundColor: "#ffdda3",
            borderColor: "#46db5f",
            match: ["amanatsu", "mandarian", "cuties", "clementine", "grapefruit", "kinnow", "kiyomi", "kumquat", "rangpur", "satsuma", "tangerine", "tangelo", "tangor"],
            averageLifeDaysFreezer: 30 * 6,
            averageLifeDaysFridge: 7 * 4,
            averageLifeDaysPantry: 14,
            useSoonDaysThreshold: 5,
            useOrDiscardSoonDaysThreshold: 10,
            category: foodCategory.Fruits
        }, {
            name: "melon",
            symbol: "🍈",
            backgroundColor: "#cdfaaa",
            borderColor: "#c7c554",
            match: ["cantaloupe", "honeydew", "yubari", "muskmelon"],
            averageLifeDaysFreezer: 30 * 6,
            averageLifeDaysFridge: 10,
            averageLifeDaysPantry: 5,
            useSoonDaysThreshold: 3,
            useOrDiscardSoonDaysThreshold: 5,
            category: foodCategory.Fruits
        }, {
            name: "grape",
            symbol: "🍇",
            backgroundColor: "#7a5382",
            borderColor: "#c5ff9c",
            averageLifeDaysFreezer: 30 * 6,
            averageLifeDaysFridge: 14,
            averageLifeDaysPantry: 7,
            useSoonDaysThreshold: 3,
            useOrDiscardSoonDaysThreshold: 7,
            category: foodCategory.Fruits
        }, {
            name: "prepared",
            symbol: "🥘",
            backgroundColor: "#fac16b",
            borderColor: "#7cab43",
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 30 * 2,
            averageLifeDaysPantry: 2,
            useSoonDaysThreshold: 7,
            useOrDiscardSoonDaysThreshold: 7,
            category: foodCategory.Prepared
        }, {
            name: "sauce",
            symbol: "🥘",
            match: [ "stew", "chutney", "prepared", "dressing"],
            backgroundColor: "#fac16b",
            borderColor: "#7cab43",
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 30 * 2,
            averageLifeDaysPantry: 2,
            useSoonDaysThreshold: 7,
            useOrDiscardSoonDaysThreshold: 7,
            category: foodCategory.Prepared
        }, {
            name: "vegetables",
            symbol: "🥬",
            backgroundColor: "#7ecc78",
            borderColor: "#4ac748",
            match: ["lettuce", "spinach", "kale", "collard", "chard", "fresh basil", "cilantro", "leaf", "romaine", "cabbage", "bok choi", "endive", "vegetable"],
            averageLifeDaysFreezer: 365 / 2,
            averageLifeDaysFridge: 10,
            averageLifeDaysPantry: 5,
            useSoonDaysThreshold: 3,
            useOrDiscardSoonDaysThreshold: 7,
            category: foodCategory.Vegetables
        }, {
            name: "breads",
            symbol: "🍞",
            backgroundColor: "#fff2ba",
            borderColor: "#c4a55c",
            match: [ "bread", "loaf", "loaves", "english muffin", "cracker" ],
            averageLifeDaysFreezer: 365 / 2,
            averageLifeDaysFridge: 30,
            averageLifeDaysPantry: 14,
            useSoonDaysThreshold: 5,
            useOrDiscardSoonDaysThreshold: 5,
            category: foodCategory.Breads
        }, {
            name: "nuts and seeds",
            symbol: "🥜",
            backgroundColor: "#d6a960",
            borderColor: "#917240",
            match: ["nut", "seed", "peanut butter", "almond butter", "peanut", "almond", "cashew", "pistachio", "pecan", "hazelnut", "chestnut", "macadamia", "rotini"],
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 365,
            averageLifeDaysPantry: 365 / 2,
            useSoonDaysThreshold: 7,
            useOrDiscardSoonDaysThreshold: 30,
            category: foodCategory.Nuts_and_Seeds
        }, {
            name: "vinegars",
            symbol: "🍾",
            backgroundColor: "#9cf7ab",
            borderColor: "white",
            match: [ "vinegar" ],
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 365,
            averageLifeDaysPantry: 365 / 2,
            useSoonDaysThreshold: 30,
            useOrDiscardSoonDaysThreshold: 30,
            category: foodCategory.Vinegars
        }, {
            name: "alcohols",
            symbol: "🥃",
            backgroundColor: "#fced77",
            borderColor: "#918b57",
            match: [ "alcohol", "beer", "wine", "spirits", "vodka", "rum", "liqueur", "gin", "whiskey", "bourbon", "cider", "hard cider", "cooler" ],
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 365,
            averageLifeDaysPantry: 365,
            useSoonDaysThreshold: 60,
            useOrDiscardSoonDaysThreshold: 60,
            category: foodCategory.Alcochols
        }, {
            name: "pastas",
            symbol: "🍝",
            backgroundColor: "#f2f59f",
            borderColor: "#d44317",
            match: [ "pasta", "ravioli", "fettuccine", "angel hair", "macaroni", "fusilli", "bow tie", "penne", "ziti", "lasagna", "lasagne", "tortellini", "linguine", "spaghetti", "noodle"],
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 365,
            averageLifeDaysPantry: 365 / 2,
            useSoonDaysThreshold: 7,
            useOrDiscardSoonDaysThreshold: 30,
            category: foodCategory.Pastas
        }, {
            name: "baby food",
            symbol: "👶",
            backgroundColor: "#badbff",
            borderColor: "#ffbade",
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 365,
            averageLifeDaysPantry: 365 / 2,
            useSoonDaysThreshold: 20,
            useOrDiscardSoonDaysThreshold: 10,
            category: foodCategory.Baby_Food
        }, {
            name: "legumes",
            symbol: "🌱",
            backgroundColor: "#8f7336",
            borderColor: "#58a83b",
            match: [ "bean", "sprout"],
            averageLifeDaysFreezer: 365 * 2,
            averageLifeDaysFridge: 365,
            averageLifeDaysPantry: 365 / 2,
            useSoonDaysThreshold: 7,
            useOrDiscardSoonDaysThreshold: 30,
            category: foodCategory.Legumes
        }, {
            name: "grains and cereals",
            symbol: "🌾",
            backgroundColor: "#9fc9ae",
            borderColor: "#cdd14d",
            match: ["gain", "cereal", "rice", "rice pilaf", "oat", "grit", "couscous", "popcorn", "quinoa"],
            averageLifeDaysFreezer: 365 * 2,
            averageLifeDaysFridge: 365,
            averageLifeDaysPantry: 365 / 2,
            useSoonDaysThreshold: 7,
            useOrDiscardSoonDaysThreshold: 30,
            category: foodCategory.Grains_and_Cereals
        }, {
            name: "baking",
            symbol: "🧁",
            backgroundColor: "#e0b4db",
            borderColor: "#ff6ec0",
            match: [ "extract", "corn starch", "flour", "baking powder", "baking soda" ],
            averageLifeDaysFreezer: 365 * 2,
            averageLifeDaysFridge: 365,
            averageLifeDaysPantry: 365,
            useSoonDaysThreshold: 7,
            useOrDiscardSoonDaysThreshold: 30,
            category: foodCategory.Baking
        }, {
            name: "seasonings",
            symbol: "🧂",
            backgroundColor: "#d9cfb6",
            borderColor: "#787878",
            match: [ "seasoning", "lemon pepper", "onion powder", "garlic powder", "butter seasoning", "chicken boullion", "beef boullion", "vegetable boullion", " herb", "herb ", "herbs ", "spice", "stock", "salt" ],
            averageLifeDaysFreezer: 365 * 2,
            averageLifeDaysFridge: 365 * 2,
            averageLifeDaysPantry: 365 * 2,
            useSoonDaysThreshold: 30,
            useOrDiscardSoonDaysThreshold: 90,
            category: foodCategory.Seasonings
        }, {
            name: "cheeses",
            match: [ "cheese" ],
            symbol: "🧀",
            backgroundColor: "#e8e67d",
            borderColor: "#70d7ff",
            averageLifeDaysFreezer: 30 * 7,
            averageLifeDaysFridge: 30,
            averageLifeDaysPantry: 3,
            useSoonDaysThreshold: 3,
            useOrDiscardSoonDaysThreshold: 10,
            category: foodCategory.Cheeses
        }, {
            name: "canned",
            symbol: "🥫",
            backgroundColor: "#a1a1a1",
            borderColor: "#4f4f4f",
            averageLifeDaysFreezer: 0,
            averageLifeDaysFridge: 365,
            averageLifeDaysPantry: 365,
            useSoonDaysThreshold: 14,
            useOrDiscardSoonDaysThreshold: 60,
            category: foodCategory.Canned
        },{
            name: "bacon",
            symbol: "🥓",
            backgroundColor: "#eb6844",
            borderColor: "#f2b5a5",
            match: [
                "rashers",
            ],
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 7,
            averageLifeDaysPantry: 30,
            useSoonDaysThreshold: 5,
            useOrDiscardSoonDaysThreshold: 7,
            category: foodCategory.Meats
        },{
            name: "crab",
            symbol: "🦀",
            backgroundColor: "#d92525",
            borderColor: "#cc7474",
            averageLifeDaysFreezer: 365 / 2,
            averageLifeDaysFridge: 2,
            averageLifeDaysPantry: 0,
            useSoonDaysThreshold: 1,
            useOrDiscardSoonDaysThreshold: 3,
            category: foodCategory.Meats
        },{
            name: "fish",
            symbol: "🐟",
            backgroundColor: "#b1e6e6",
            borderColor: "#b0b0b0",
            match: [
                "salmon",
                "tuna",
                "trout",
                "cod",
                "halibut",
                "bass",
                "mahi mahi",
                "mahi-mahi",
                "flounder",
                "snapper",
                "catfish",
                "swordfish",
                "whitefish",
                "tilapia",
                "monkfish",
                "grouper",
                "butterfish",
                "butter fish",
                "roughy",
                "eel",
                "mackerel",
                "sardine",
                "anchovy",
                "herring",
                "lingcod",
                "john dory",
                "sturgeon",
                "brill",
                "lamprey",
                "herring",
                "haddock",
                "pollock",
                "turbot",
                "squid",
                "calamari",
                "octopus",
            ],
            averageLifeDaysFreezer: 365 / 2,
            averageLifeDaysFridge: 2,
            averageLifeDaysPantry: 0,
            useSoonDaysThreshold: 1,
            useOrDiscardSoonDaysThreshold: 3,
            category: foodCategory.Meats
        },{
            name: "olive",
            symbol: "🫒",
            backgroundColor: "#77c97c",
            borderColor: "#1a751f",
            averageLifeDaysFreezer: 365 / 2,
            averageLifeDaysFridge: 10,
            averageLifeDaysPantry: 3,
            useSoonDaysThreshold: 1,
            useOrDiscardSoonDaysThreshold: 2,
            category: foodCategory.Vegetables
        }, {
            name: "sandwich",
            symbol: "🥪",
            backgroundColor: "#c7ab6d",
            borderColor: "#94742e",
            match: ["sandwiches"],
            averageLifeDaysFreezer: 365 / 2,
            averageLifeDaysFridge: 4,
            averageLifeDaysPantry: 1,
            useSoonDaysThreshold: 1,
            useOrDiscardSoonDaysThreshold: 1,
            category: foodCategory.Prepared
        },{
            name: "shrimp",
            symbol: "🦐",
            backgroundColor: "#f57878",
            borderColor: "#d4301e",
            match: [
                "prawn", "shellfish"
            ],
            averageLifeDaysFreezer: 365 / 2,
            averageLifeDaysFridge: 2,
            averageLifeDaysPantry: 0,
            useSoonDaysThreshold: 1,
            useOrDiscardSoonDaysThreshold: 3,
            category: foodCategory.Meats
        },{
            name: "lobster",
            symbol: "🦞",
            backgroundColor: "#d92525",
            borderColor: "#cc7474",
            match: [
                "crawfish",
                "crayfish",
                "crawdad"
            ],
            averageLifeDaysFreezer: 365 / 2,
            averageLifeDaysFridge: 2,
            averageLifeDaysPantry: 0,
            useSoonDaysThreshold: 1,
            useOrDiscardSoonDaysThreshold: 3,
            category: foodCategory.Meats
        },{
            name: "meats",
            symbol: "🥩",
            backgroundColor: "#cf8f8f",
            borderColor: "#ad5f49",
            match: [
                "meat",
                "beef",
                "pork",
                "lamb",
                "venison",
                "veal",
                "goat",
                "buffalo",
                "rabbit",
                "ham",
                "pepperoni",
                "pate"
            ],
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 2,
            averageLifeDaysPantry: 0,
            useSoonDaysThreshold: 1,
            useOrDiscardSoonDaysThreshold: 3,
            category: foodCategory.Meats
        },{
            name: "poultry",
            symbol: "🍗",
            backgroundColor: "#fcd89d",
            borderColor: "#616161",
            match: [
                "chicken",
                "turkey",
                "duck",
                "goose",
                "geese",
                "guinea fowl",
                "pigeon",
                "hen",
                "cornish game hen",
                "quail",
                "bird",
                "fowl",
                "pheasant"
            ],
            averageLifeDaysFreezer: 365,
            averageLifeDaysFridge: 2,
            averageLifeDaysPantry: 0,
            useSoonDaysThreshold: 1,
            useOrDiscardSoonDaysThreshold: 3,
            category: foodCategory.Meats
        },
        {
            name: "oils",
            symbol: "🍳",
            backgroundColor: "#f8ffbf",
            borderColor: "#616161",
            match: ["cooking spray", "oil", "lard", "ghee", "clarified butter"],
            averageLifeDaysFreezer: 365 * 2,
            averageLifeDaysFridge: 365,
            averageLifeDaysPantry: 365,
            useSoonDaysThreshold: 14,
            useOrDiscardSoonDaysThreshold: 30,
            category: foodCategory.Oils
        },
        {
            name: "milks and creams",
            symbol: "🥛",
            backgroundColor: "#f0efdf",
            borderColor: "#4568f5",
            match: [
                "milk",
                "cream",
                "buttermilk",
                "yogurt"
            ],
            averageLifeDaysFreezer: 30 * 5,
            averageLifeDaysFridge: 7,
            averageLifeDaysPantry: 0,
            useSoonDaysThreshold: 3,
            useOrDiscardSoonDaysThreshold: 5,
            category: foodCategory.Milks_and_Creams
        }
    ];

    getShelfLifeMetadataByName(name: string) {
        if(this.shelfLifeNameDictionary.has(name)) {
            return this.setRandomChefIcon(this.shelfLifeNameDictionary.get(name));
        }
    }

    getDaysUntilExpiration(expiration: Date):number {
        const now = moment();
        const exp = moment(expiration);

        return now.diff(exp, 'days');
    }

    getDaysSinceUpdated(lastUpdated: Date):number {
        const now = moment();
        const updated = moment(lastUpdated);

        return now.diff(updated, 'days');
    }

    async getShelfLifeMetadataByItem(item: IInventoryItemModel): Promise<IShelfLifeMetadata>{
        if(!item) {
            return null;
        }
        await when(() => this.initialized);

        const itemMetadata = this.getMetadataByItem(item);
        if(!item || !itemMetadata) {
            return null;
        }
        const expDiff = this.getDaysUntilExpiration(item.expiration) ;//item.getDaysUntilExpiration();
        let shelfLifeMetadata: IShelfLifeMetadata;

        if(expDiff < 0) {
            const expDiffAbs = Math.abs(expDiff);
            if(expDiffAbs >= (await itemMetadata).useSoonDaysThreshold) {
                shelfLifeMetadata = this.getShelfLifeMetadataByName("Fresh");
            } else {
                shelfLifeMetadata = this.getShelfLifeMetadataByName("Use Soon");
            }
            shelfLifeMetadata.expiresInMessage = `Expires in ${expDiffAbs} day`;
            if(expDiffAbs > 1) shelfLifeMetadata.expiresInMessage += 's';
        } else {
            if(expDiff < (await itemMetadata).useOrDiscardSoonDaysThreshold) {
                shelfLifeMetadata = this.getShelfLifeMetadataByName("Use or Discard Soon");
            } else {
                shelfLifeMetadata = this.getShelfLifeMetadataByName("Discard");
            }
            
            
            if(expDiff === 0) {
                shelfLifeMetadata.expiresInMessage = "Expired today";
            } else {
                shelfLifeMetadata.expiresInMessage = `Expired ${expDiff} day`;
                (expDiff > 1) ? shelfLifeMetadata.expiresInMessage += 's ago' : shelfLifeMetadata.expiresInMessage += ' ago';
            }
            
        }

        return this.setRandomChefIcon(shelfLifeMetadata);
    }

    private setRandomChefIcon(shelfLife: IShelfLifeMetadata) {
        if(shelfLife.name === "Fresh") {
            shelfLife.symbol = TextUtils.randomChef();
        }
        return shelfLife;
    }

    getMetadataByName(lowerName: string): IItemMetadata {
        if(!lowerName) {
            return null;
        }
        lowerName = lowerName.toLowerCase();
        
        // first try to get an exact match by food name
        if(this.metaDataNameDictionary.has(lowerName)) {
            return this.metaDataNameDictionary.get(lowerName);
        } else if(this.metaDataMatchDictionary) { // see if subcategories can get an exact match
            return this.metaDataMatchDictionary.get(lowerName);
        }
        return null;
    }

    getCategorySymbol(foodCategory: foodCategory | undefined): string {
        if(foodCategory == undefined) {
            return "?";
        }
        const foodCategoryName: string = TextUtils.foodCategory(foodCategory).toLowerCase();
        const itemMetaData = this.getMetadataByName(foodCategoryName);
        return itemMetaData?.symbol;
    }

    getCategoryColor(foodCategory: foodCategory | undefined): string {
        const foodCategoryName: string = TextUtils.foodCategory(foodCategory).toLowerCase();
        const itemMetaData = this.getMetadataByName(foodCategoryName);
        return itemMetaData?.backgroundColor || 'white';
    }

    async getMetadataByItem(item: IInventoryItemModel): Promise<IItemMetadata> {
        if(!item) {
            return null;
        }
        await when(() => this.initialized);

        const lowerCategory = TextUtils.foodCategory(item?.foodCategories?.length > 0 ? item?.foodCategories[0] : 0).toLowerCase();
        const metadataByName = this.getMetadataByName(item?.food);

        // first try to get a match by food name
        if(metadataByName?.name === lowerCategory || lowerCategory && !metadataByName) {
            // if the category is already set to this, try to be more specific and match substrings
            // this is a "ghost subcategory"
            //console.warn("Searching in standard name to map indices *EXPENSIVE*");
            const standardName = item?.variety.toLowerCase() + " " + item?.food.toLowerCase();
            const nameIndArr:Array<string> = Array.from(this.metaDataNameDictionary.keys());
            const currentFoodCategoryName = item?.foodCategories?.length > 0 ? TextUtils.foodCategory(item?.foodCategories[0]).toLowerCase() : null;
            for(let i = 0; i < nameIndArr.length; i++) {
                if(standardName.indexOf(nameIndArr[i]) >= 0) {
                    if(item?.foodCategories?.length > 0 && nameIndArr[i] !== currentFoodCategoryName) {
                        //console.warn("Matched Subcategory " + nameIndArr[i], " it's not " + currentFoodCategoryName);
                        return this.metaDataNameDictionary.get(nameIndArr[i]);
                    }
                    
                }
            }
            //console.warn("Finished Expensive Search, no results.");
            // MORE expensive, search against subcategory matches
            //console.warn("Searching in subcateory to map indecies *MORE EXPENSIVE*");
            const matchIndArr:Array<string> = Array.from(this.metaDataMatchDictionary.keys());
            for(let k = 0; k < matchIndArr.length; k++) {
                if(standardName.indexOf(matchIndArr[k]) >= 0) {
                    if(matchIndArr[k] !== currentFoodCategoryName) {
                        //console.warn("Matched Deep Subcategory " +  matchIndArr[k], " it's still not " + currentFoodCategoryName);
                        return this.metaDataMatchDictionary.get(matchIndArr[k]);
                    }
                }
            }

            //console.warn("Fininshed Two Expensive Searches, no results *FAIL*");
            return metadataByName || this.metaDataNameDictionary.get(lowerCategory);
        } else if (metadataByName) {
            //console.warn("Good Match");
            return metadataByName;
        } else if (lowerCategory) { 
            // when all else fails use the metadata for the category
            return this.metaDataNameDictionary.get(lowerCategory);
        }
        
        // default if not found
        return this.itemMetaData[0];
    }
}