import { IInventoryItemModel, foodCategory, foodMeasurement, storageFormat, storageLocation} from '../domains/inventory/InventoryItemModel'
import { numberToWords } from 'v-number-to-words';

export class TextUtils {

    public static foodCategory(input: foodCategory): string {
        
        switch(+input) {
            case foodCategory.Alcochols:
                return "Alcohols";
            case foodCategory.Baby_Food:
                return "Baby Food";
            case foodCategory.Baking:
                return "Baking";
            case foodCategory.Beverages:
                return "Beverages";
            case foodCategory.Breads:
                return "Breads";
            case foodCategory.Canned:
                return "Canned";
            case foodCategory.Cheeses:
                return "Cheeses";
            case foodCategory.Coffee:
                return "Coffee";
            case foodCategory.Confectionaries:
                return "Confectionaries";
            case foodCategory.Dried:
                return "Dried";
            case foodCategory.Eggs:
                return "Eggs";
            case foodCategory.Fruits:
                return "Fruits";
            case foodCategory.Grains_and_Cereals:
                return "Grains and Cereals";
            case foodCategory.Ice:
                return "Ice";
            case foodCategory.Legumes:
                return "Legumes";
            case foodCategory.Meats:
                return "Meats";
            case foodCategory.Milks_and_Creams:
                return "Milks and Creams";
            case foodCategory.Nuts_and_Seeds:
                return "Nuts and Seeds";
            case foodCategory.Oils:
                return "Oils";
            case foodCategory.Other:
                return "Other";
            case foodCategory.Pastas:
                return "Pastas";
            case foodCategory.Pet_Foods:
                return "Pet Foods";
            case foodCategory.Prepared:
                return "Prepared";
            case foodCategory.Preserves:
                return "Preserves";
            case foodCategory.Sauces:
                return "Sauces";
            case foodCategory.Seasonings:
                return "Seasonings";
            case foodCategory.Tea:
                return "Tea";
            case foodCategory.Vegetables:
                return "Vegetables";
            case foodCategory.Vinegars:
                return "Vinegars";
            case foodCategory.Yogurts:
                return "Yogurts";
            default:
                return "Unknown";
        }
    }

    public static listSelectedCategories(input: foodCategory[]) {
        const result: string[] = []

        for(let i = 0; i < input.length; i++) {
            result.push(this.foodCategory(input[i]));
        }

        return result.length > 0 ? '(' + result.join(', ') + ')' : '' ;
    }

    public static foodMeasurementIndex(onHand: number): any[] {
        const index: any[] = [];

        for(let i = 0; i < Object.keys(foodMeasurement).length / 2; i++) {
            index.push({
                id: i.toString(),
                name: this.foodMeasurement(i, false, onHand)
            });
        }

        return index;
    }

    public static storageLocationIndex(): any[] {
        const index: any[] = [];

        for(let i = 0; i < Object.keys(storageLocation).length / 2; i++) {
            index.push({
                id: i.toString(),
                name: this.storageLocation(i)
            });
        }

        return index;
    }

    public static storageFormatIndex(onHand: number): any[] {
        const index: any[] = [];

        for(let i = 0; i < Object.keys(storageFormat).length / 2; i++) {
            index.push({
                id: i.toString(),
                name: this.storageFormat(i, onHand)
            });
        }

        return index;
    }

    public static foodCategoryIndex(): any[] {
        const index: any[] = [];

        for(let i = 0; i < Object.keys(foodCategory).length / 2; i++) {
            index.push({
                id: i.toString(),
                name: this.foodCategory(i)
            });
        }

        return index;
    }

    public static foodMeasurement(input: foodMeasurement, abbreviation: boolean, quantity?: number): string {
        quantity = quantity || 1;
        if(abbreviation) {
            switch (input) {
                case foodMeasurement.oz:
                    return "oz";
                case foodMeasurement.fl_oz:
                    return "fl oz";
                case foodMeasurement.gal:
                    return "gal";
                case foodMeasurement.lb:
                    return "lb";
                case foodMeasurement.g:
                    return "g";
                case foodMeasurement.count:
                    return "ct";
                default:
                    return "unknown";
            }
        } else {
            switch (input) {
                case foodMeasurement.oz:
                    return quantity !== 1 ? "Ounces" : "Ounce";
                case foodMeasurement.fl_oz:
                    return quantity !== 1 ? "Fluid Ounces" : "Fluid Ounce";
                case foodMeasurement.lb:
                    return quantity !== 1 ? "Pounds" : "Pound";
                case foodMeasurement.gal:
                    return quantity !== 1 ? "Gallons" : "Gallon";
                case foodMeasurement.g:
                    return quantity !== 1 ? "Grams" : "Gram";
                case foodMeasurement.count:
                    return "Count";
                default:
                    return "Unknown";
            }
        }
    }

    public static measurementArray(abbreviation: boolean, plural?:boolean): string[] {
        const result: string[] = [];
        const count = plural ? 2 : 1;

        for( let i = 0; i < Object.keys(foodMeasurement).length / 2; i++) {
            result.push(this.foodMeasurement(i, abbreviation, count))
        }

        return result;
    }

    public static storageFormat(input: storageFormat, quantity?: number): string {
        quantity = quantity || 1;
        switch(input) {
            case storageFormat.Bag:
                return quantity > 1 ? "Bags" : "Bag";
            case storageFormat.Barrel:
                return quantity > 1 ? "Barrels" : "Barrel";
            case storageFormat.Basket:
                return quantity > 1 ? "Baskets" : "Basket";
            case storageFormat.Blister:
                return quantity > 1 ? "Blisters" : "Blister";
            case storageFormat.Block:
                return quantity > 1 ? "Blocks" : "Block";
            case storageFormat.Bottle:
                return quantity > 1 ? "Bottles" : "Bottle";
            case storageFormat.Box:
                return quantity > 1 ? "Boxes" : "Box";
            case storageFormat.Bucket:
                return quantity > 1 ? "Buckets" : "Bucket";
            case storageFormat.Carton:
                return quantity > 1 ? "Cartons" : "Carton";
            case storageFormat.Can:
                return quantity > 1 ? "Cans" : "Can";
            case storageFormat.Case:
                return quantity > 1 ? "Cases" : "Case";
            case storageFormat.Crate:
                return quantity > 1 ? "Creates" : "Crate";
            case storageFormat.Flat:
                return quantity > 1 ? "Flats" : "Flat";
            case storageFormat.Grinder:
                return quantity > 1 ? "Grinders" : "Grinder";
            case storageFormat.Jar:
                return quantity > 1 ? "Jars" : "Jar";
            case storageFormat.Jug:
                return quantity > 1 ? "Jugs" : "Jug";
            case storageFormat.Log:
                return quantity > 1 ? "Log" : "Logs";
            case storageFormat.Other:
                return "Other";
            case storageFormat.Packet:
                return quantity > 1 ? "Packets" : "Packet";
            case storageFormat.Pallet:
                return quantity > 1 ? "Pallets" : "Pallet";
            case storageFormat.Roll:
                return quantity > 1 ? "Rolls" : "Roll";
            case storageFormat.Spool:
                return quantity > 1 ? "Spools" : "Spool";
            case storageFormat.Tray:
                return quantity > 1 ? "Trays" : "Tray";
            case storageFormat.Tub:
                return quantity > 1 ? "Tubs" : "Tub";
            case storageFormat.Tube:
                return quantity > 1 ? "Tubes" : "Tube";
            case storageFormat.Wrapper:
                return quantity > 1 ? "Wrappers" : "Wrapper";
            default:
                return "unknown";
        }
    }

    public static storageFormatArray(): string[] {
        const result: string[] = [];

        for( let i = 0; i < Object.keys(storageFormat).length / 2; i++) {
            result.push(this.storageFormat(i, 2));
        }

        return result;
    }

    public static storageLocation(input: storageLocation): string {
        switch(input) {
            case storageLocation.Pantry:
                return "Pantry";
            case storageLocation.Refrigerator:
                return "Refrigerator";
            case storageLocation.Freezer:
                return "Freezer";
            case storageLocation.Storage:
                return "Storage";
            case storageLocation.Travel:
                return "Travel";
            default:
                return "Unknown";
        }
    }

    public static storageLocationArray(): string[] {
        const result: string[] = [];

        for( let i = 0; i < Object.keys(storageLocation).length / 2; i++) {
            result.push(this.storageLocation(i));
        }

        return result;
    }

    public static convertAndCapitalizeNumberWords(input: string) {
        // filter intput
        input = input.replace("two tenths", "one fifth");
        input = input.replace("four tenths", "two fifths");
        input = input.replace("five tenths", "one half");
        input = input.replace("six tenths", "three fifths");
        input = input.replace("eight tenths", "four fifths");
        input = input.replace("zero and ", "");
        const wordArr: string[] = input.split(' ');
        for(let i = 0; i < wordArr.length; i++) {
            if(wordArr[i] !== 'a' && wordArr[i] !== 'and') {
                wordArr[i] = wordArr[i][0].toUpperCase() + wordArr[i].substring(1, wordArr[i].length);
            }
        }

        return wordArr.join(' ');
    }

    // adds our needed functionality to v-number-to-words
    public static betterNumberToWords(input: number) {
        if(!input || input === 1) {
            return '';
        }

        // we're not going to worry about greater than two decimal places
        let numString: string = input.toFixed(2).replace(".00", "");
        input = +numString;

        if(numString.indexOf('.') === 0) {
            numString = '0' + numString;
        }
        
        const decimalIndex: number = numString.indexOf('.');
        if(decimalIndex > 0) {
            const beforeDecimalNumber: number = +numString.substring(0, decimalIndex);
            const beforeDecimalWords:string = numberToWords(beforeDecimalNumber);            
            const afterDecimal:string = numString.substring(decimalIndex + 1);
            const lessThanOne:boolean = beforeDecimalNumber === 0;
            // if not quarters then round down
            let quarterCase: string = '';
            if(afterDecimal === "25") {
                quarterCase = lessThanOne ? 'one quarter' : beforeDecimalWords + ' and a quarter';
            } else if (afterDecimal === '50' || afterDecimal === '5') {
                quarterCase = lessThanOne ? 'one half' : beforeDecimalWords + ' and a half';
            } else if (afterDecimal === '75') {
                quarterCase = lessThanOne ? 'three quarters' : beforeDecimalWords + ' and three quarters';
            } else {
                // round down
                numString = input.toFixed(1).replace('.0', '');
                input = +numString;
            }
            if(quarterCase.length > 0) {
                return this.convertAndCapitalizeNumberWords(quarterCase);
            }
        }

        return this.convertAndCapitalizeNumberWords(numberToWords(input));
    }

    public static numbersWithFraction(input: number): string {
        if(!input) {
            return '';
        }
        let inStr: string = input.toFixed(2);
        while(inStr.endsWith("0") || inStr.endsWith(".")) {
            if(
                inStr.endsWith(".75") ||
                inStr.endsWith(".25") ||
                inStr.endsWith(".66") ||
                inStr.endsWith(".33")
            ) {
                break;
            }
            
            if(inStr.endsWith(".")) {
                inStr = inStr.substr(0, inStr.length - 1);
                break;
            } else {
                inStr = inStr.substr(0, inStr.length - 1);
            }
        }
        const decimalIndex = inStr.indexOf(".");
        if(decimalIndex > -1) {
            const beforeDecimalNumber: number = +inStr.substring(0, decimalIndex);          
            let afterDecimal:string = inStr.substring(decimalIndex + 1);

            switch(afterDecimal) {
                case "9":
                    afterDecimal = "⁹⁄₁₀";
                    break;
                case "8":
                    afterDecimal = "⅘";
                    break;
                case "75":
                    afterDecimal = "¾";
                    break;
                case "7":
                    afterDecimal = "⁷⁄₁₀";
                    break;
                case "6":
                    afterDecimal = "⅗";
                    break;
                case "66":
                    afterDecimal = "⅔";
                    break;
                case "5":
                    afterDecimal = "½";
                    break;
                case "4":
                    afterDecimal = "⅖";
                    break;
                case "3":
                case "33": 
                    afterDecimal = "⅓";
                    break;
                case "25":
                    afterDecimal = "¼";
                    break;
                case "2":
                    afterDecimal = "⅕";
                    break;
                case "1":
                    afterDecimal = "⅒";
                    break;
                default:
                    afterDecimal = "." + afterDecimal;
            }
            return beforeDecimalNumber >= 1 ? beforeDecimalNumber + afterDecimal : afterDecimal;
        }
        return inStr;
    }

    public static friendlyExpression(model: IInventoryItemModel, abbreviation: boolean): string {
        if(model?.measurement == undefined) {
            return '';
        }
        const expression:string[] = [];
        //const numberWord = this.betterNumberToWords(model.containersOnHand);
        const fractionNumbers = this.numbersWithFraction(model.containersOnHand);
        if(model.containersOnHand !== 1 && model.measurement !== foodMeasurement.count) {
            expression.push("(" + fractionNumbers + ")");
        }
        /*if(numberWord && numberWord.length > 0 && model.measurement.valueOf() !== foodMeasurement.count) {
            expression.push(numberWord);
        }*/
        if(model.capacity) {
            if(model.measurement.valueOf() !== foodMeasurement.count) {
                expression.push(model.capacity?.toString() + TextUtils.foodMeasurement(model.measurement, abbreviation, model.containersOnHand));
                expression.push(TextUtils.storageFormat(model.storageFormat, model.containersOnHand));
                expression.push("of");
            } else if(model.measurement === foodMeasurement.count) {
                expression.push(model.containersOnHand?.toString());
            } else {
                expression.push(model.capacity.toFixed(0));
            }
        }

        if(model.measurement === foodMeasurement.count && model.containersOnHand) {
            expression.push(model.containersOnHand.toString())
        }
        
        if(model.brand && model.brand.length > 0 && model.brand !== 'brandless') {
            expression.push(model.brand);
        }
        if(model.variety && model.variety.length > 0 && model.variety !== 'plain') {
            expression.push(model.variety);
        }
        expression.push(model.food);

        return expression.join(" ");
    }

    public static qualifiedFoodname(model: IInventoryItemModel): string {
        return `${model.variety} ${model.food}`;
    }

    public static makeTotalItemQuantityString(model: IInventoryItemModel): string {
        if(model?.measurement == undefined) {
            return '';
        }
        let totalOnHand;
        const locationSymbol = this.locationSymbol(model.storageLocation);
        if(model.measurement === foodMeasurement.count) {
            return `${model.containersOnHand} ${model.food}${locationSymbol}`
        } else {
            if(model.measurement.valueOf() !== foodMeasurement.count) {
                totalOnHand =  (model.containersOnHand * model.capacity).toFixed(0);
                return `${totalOnHand}${this.foodMeasurement(model.measurement, true, model.containersOnHand * model.capacity)} of ${model.food}${locationSymbol}`;
            } else {
                totalOnHand =  (model.containersOnHand * model.capacity).toFixed(0);
                return `${totalOnHand} ${model.food}${locationSymbol}`
            }
        }
        
    }

    public static locationSymbol(location: storageLocation, symbolOnly = false) {
        const prefix = " in ";
        let result;
        switch(location) {
            case storageLocation.Pantry:
                result = "🚪";
                break;
            case storageLocation.Freezer:
                return "🧊";
            case storageLocation.Refrigerator:
                return "❄️";
            case storageLocation.Storage:
                return "📦";
            case storageLocation.Travel:
                return "🎒";
            default:
                return "?";
        }

        return symbolOnly ? result : prefix + result;
    }

    public static randomChef() {
        // for the equality of men, women and people of color, pick a random emoji chef whenever we need one
        const itsASmallWorld: Array<string> = [
            "👨‍🍳",
            "👨🏻‍🍳",
            "👨🏼‍🍳",
            "👨🏽‍🍳",
            "👨🏾‍🍳",
            "👨🏿‍🍳",
            "👩‍🍳",
            "👩🏻‍🍳",
            "👩🏼‍🍳",
            "👩🏽‍🍳",
            "👩🏾‍🍳",
            "👩🏿‍🍳",
        ]
        return itsASmallWorld[this.getRandomIntInclusive(0, itsASmallWorld.length - 1)];
    }

    public static getRandomIntInclusive(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
      }

    public static makeDaysSinceUpdatedString(days: number): string {
        /* debug 
        days = 3;
        */
        if(days === 0) {
            return 'Updated Today';
        } else {
            return days === 1 ? `Updated ${days} Day Ago` : `Updated ${days} Days Ago`;
        }
    }

    public static get defaultDateFormat(): string {
        return "MM-DD-YYYY"; //US
    }

    public static fontSizeForTitle(title: string): number {
        if(title.length < 50) {
            return 18;
        } else if (title.length < 70) {
            return 16;
        } else if (title.length < 90) {
            return 14;
        } else if (title.length  < 100) {
            return 12;
        }
    }

    public static fontSizeForFormat(format: storageFormat): number {
        switch(format) {
            case storageFormat.Grinder:
            case storageFormat.Packet:
            case storageFormat.Bottle:
            case storageFormat.Carton:
            case storageFormat.Bag:
            case storageFormat.Wedge:
            case storageFormat.Patty:
            case storageFormat.Tray:
                return 30;
            default:
                return 40;
        }
    }

    public static fontSizeForBrand(input: string): number {
        if(!input) {
            return 0;
        }
        if(input.length < 25) {
            return 20;
        } else if (input.length < 35) {
            return 16;
        }
    }

    public static fontSizeForHalfWidthInput(input: string): number {
        if(!input) {
            return 0;
        }

        if(input.length < 10) {
            return 18;
        } else if (input.length < 15) {
            return 16;
        } else if (input.length < 20) {
            return 14;
        } else if (input.length < 25) {
            return 12;
        } else {
            return 10;
        }

    }

}