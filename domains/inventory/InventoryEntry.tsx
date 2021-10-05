import React, { Component, useState } from "react";
import { observer } from 'mobx-react';
import { Text, TextInput, View, Platform, Alert, Dimensions, TextStyle, Switch, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { TextUtils } from '../../utils/Text';
import { observable, runInAction, action, toJS, when, trace } from "mobx";
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from "moment";
import { IInventoryItemModel, foodMeasurement, storageFormat, storageLocation, foodCategory, ICategoryIndex, InventoryItemModel } from "./InventoryItemModel";
import SectionedMultiSelect from 'react-native-sectioned-multi-select';
import { InventoryListItem } from './InventoryListItem';
import { DomainTypes } from '../../../Types';
import { lazyInject } from '../../../DependencyContainer';
import { IInventoryStore } from './InventoryStore';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { IAlertsStore } from '../alerts/AlertsStore';
import { IInventoryMetadataStore } from "./InventoryMetadataStore";

interface IProps {
    onSubmit: (requestGTINUpdate?: boolean) => Promise<void>
    onRemove: () => Promise<void>
    onBack: () => Promise<void>
}

const placeholderTextColor = "#8f8f8f";

@observer
export class InventoryEntry extends Component<IProps> {
    @lazyInject(DomainTypes.Inventory) private inventoryStore: IInventoryStore;
    @lazyInject(DomainTypes.Alerts) private alertsStore: IAlertsStore;
    @lazyInject(DomainTypes.InventoryMetadata) private inventoryMetadataStore: IInventoryMetadataStore;

    @observable
    inventoryItem: InventoryItemModel;

    @observable
    categoryMultiSelect: SectionedMultiSelect<ICategoryIndex>;

    @observable
    measurementMultiSelect: SectionedMultiSelect<ICategoryIndex>;

    @observable
    storageFormatMultiSelect: SectionedMultiSelect<ICategoryIndex>;

    @observable
    spacerHeight: number;

    @observable
    isEditing: boolean;

    @observable
    isCloudSyncing: boolean;

    @observable
    UIVerticalExtentPosition: number;

    @observable
    GTINUpdateOnSubmit: boolean;

    private didJustChange = false;

    private didEnableGTINToggle = false;

    nativeKeyboardReader: string;
    capacityRef: TextInput;
    brandRef: TextInput;
    varietyRef: TextInput;
    foodRef: TextInput;
    onHandRef: TextInput;

    oldRecord:InventoryItemModel = undefined;

    showHelpIcons: boolean;

    @observable
    transitionComplete: boolean;


    id: string;
    constructor(props: IProps) {
        super(props);

        runInAction( () => {
            this.inventoryItem = new InventoryItemModel(undefined, this.inventoryStore.getUID());
            this.spacerHeight = 5; // select with some grow to end logic
            this.showHelpIcons = true;
            this.inventoryItem.lastUpdated = moment().toDate();
            this.inventoryItem.expiration = moment().toDate();
            this.isEditing = false; // default starts out as a new item
        });
    }

    @action
    componentDidMount() {
        // set transition complete after a bit
        setTimeout(() => {runInAction(() => {this.transitionComplete = true}); this.forceUpdate()}, 500);
    }

    @action
    componentWillUnmount() {
        runInAction(() => this.inventoryStore.shouldAddGTINCache = false);
    }

    async update(newRecord: IInventoryItemModel) {
        this.oldRecord = this.inventoryItem;
        runInAction(() => {
            this.inventoryItem.id = newRecord.id;
            this.inventoryItem.brand = newRecord.brand != 'brandless' ? newRecord.brand : "";
            this.inventoryItem.food = newRecord.food;
            this.inventoryItem.variety = newRecord.variety != 'plain' ? newRecord.variety : "";
            this.inventoryItem.containersOnHand = newRecord.containersOnHand;
            this.inventoryItem.capacity = newRecord.capacity;
            this.inventoryItem.expiration = newRecord.expiration;
            this.inventoryItem.measurement = newRecord.measurement;
            this.inventoryItem.storageFormat = newRecord.storageFormat;
            this.inventoryItem.storageLocation = newRecord.storageLocation;
            this.inventoryItem.foodCategories = newRecord.foodCategories;
            this.inventoryItem.lastUpdated = newRecord.lastUpdated;
        });

        this.categoryMultiSelect.forceUpdate();

        if(!this.oldRecord?.food) {
            // there is no old record (adding new item)
            this.oldRecord = this.inventoryItem;
        }
    }

    platformDatePicker() {
        switch(Platform.OS) {
            case 'android':
                return null;
            case 'ios':
                const expiration = this.inventoryItem?.expiration as Date || moment().toDate();
                return (<DateTimePicker
                    value={expiration}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                        this.didJustChange = true;
                        runInAction(() => this.inventoryItem.expiration = date)
                    }}
                    style={{ width: '100%', height: 100, right: 5, left: 5 }}
                />);
        }
    }

    helpAlertByName(name: string, style?:TextStyle): JSX.Element {
        if(this.showHelpIcons) {
            return(
                <Text
                style={style}
                onPress={() => {
                    this.alertsStore.displayAlertByName(name);
                }}
                >
                    <Entypo name="help-with-circle" size={12} color="#999999" />
                </Text>
            ); 
        } else {
            return null;
        }
    }

    cardValidation = (): string => {
        const essentialsValidation = this.inventoryStore.validateAndConvertDecimals(this.inventoryItem);
        const measurementValidation = this.inventoryItem?.measurement == undefined ? "Measurement" : "";
        const formatValidation = this.inventoryItem?.storageFormat == undefined && this.inventoryItem?.measurement != foodMeasurement.count ? "Format" : "";
        const storageValidation = this.inventoryItem?.storageLocation == undefined ? "Storage Location" : "";
        const categoriesValidation = this.inventoryItem?.foodCategories?.length === 0 ? "Food Category" : "";
        

        if(essentialsValidation !== "") {
            return essentialsValidation;
        } else if (measurementValidation !== "") {
            return measurementValidation;
        } else if (formatValidation !== "") {
            return formatValidation;
        } else if (storageValidation !== "") {
            return storageValidation;
        } else if (categoriesValidation !== "") {
            return categoriesValidation;
        } 

        return "";
    };

    quickChangeOnHand(increment = true) {
        const onHand = +this.inventoryItem?.containersOnHand;

        this.didJustChange = true;
        if(this.inventoryItem?.containersOnHand == undefined) {
            runInAction(() => {
                this.inventoryItem.containersOnHand = 1;
            });
            return;
        }

        let denomination = 1;
        let onHandStr = onHand === NaN ? "" : onHand.toFixed(2);
        let decimalInd = onHandStr.indexOf(".");
        let hasDecimal = decimalInd > -1;
        while(hasDecimal && onHandStr[onHandStr.length - 1] === "0" || onHandStr[onHandStr.length - 1] === ".") {
            onHandStr = onHandStr.slice(0, onHandStr.length - 1);
        }
        decimalInd = onHandStr.indexOf(".");
        hasDecimal = decimalInd > -1;
        const decimalPlaces = hasDecimal ? (onHandStr.length) - decimalInd - 1 : 0;
        switch(decimalPlaces) {
            case 1:
                denomination = 0.1;
                break;
            case 2:
                denomination = 0.01;
                break;
        }

        // override for one
        if(onHand === 1 && !increment) {
            denomination = 0.1;
        }

        let newVal = increment ? this.inventoryItem?.containersOnHand + denomination : this.inventoryItem?.containersOnHand - denomination;
        newVal = parseFloat(newVal.toFixed(2));
        
        runInAction(() => {
            this.inventoryItem.containersOnHand = newVal;
        });

        this.checkOnHandDepleted();

    }

    checkOnHandDepleted(): void {
        if(this.inventoryItem?.containersOnHand <= Number.EPSILON) {
            if(this.isEditing) {
                Alert.alert(
                    "Toss Item",
                    "New quantity is zero or less. The item will be tossed. Are you sure?",
                    [
                        {
                            text: "Cancel",
                            style: 'cancel',
                            onPress: () => { runInAction(() => {this.inventoryItem.containersOnHand = 1}) }
                        },
                        {
                            text: "OK",
                            onPress: async () => {runInAction(() => this.isCloudSyncing = true); await this.props.onRemove(); runInAction(() => this.isCloudSyncing = false); Promise.resolve(true);}
                        }
                    ]
                );
            } else {
                Alert.alert(
                    "Invalid On Hand",
                    "You must enter a quantity greater than zero when adding a new product.",
                    [
                        {
                            text: "OK",
                            onPress: () => { runInAction(() => {this.inventoryItem.containersOnHand = 1;}) }
                        }
                    ]
                )
            }
            
        }
    }

    onVerticalExtentLayout = (e: any) => {
        // off for now
        // return;

        /*if(!this.transitionComplete) {
            return;
        }*/
        //console.warn("UI Extent:" + e.nativeEvent.layout.y);
        runInAction(() => this.UIVerticalExtentPosition = e.nativeEvent.layout.y);
        // grow spacer until view fits height
        //console.warn("Window Height:" + Dimensions.get('window').height);
        // const windowHeight = Dimensions.get('window').height;
        const limit = Dimensions.get('window').height - 100;
        if(this.UIVerticalExtentPosition < limit) {
            const diff = limit - this.UIVerticalExtentPosition;
            const increaseBy = diff >= 60 ? 60 : diff;
            //console.warn("Extent: " + this.UIVerticalExtentPosition + " Limit: " + limit + " Diff: " + diff + " Increase By: " + increaseBy);
            runInAction(() => this.spacerHeight += increaseBy);
        } else {
            //console.warn("Extent Moved To: " + this.UIVerticalExtentPosition)
        }
    }

    render() {
        trace(true);
        const DismissKeyboard = ({ children }) => (
            <ScrollView
            scrollEnabled={false}
            keyboardShouldPersistTaps={'never'}
            >
                {children}
            </ScrollView>
        );

        if(this.inventoryStore.shouldAddGTINCache && this.inventoryStore.isGTINPowerUser && !this.didEnableGTINToggle) {
            this.didEnableGTINToggle = true;
            runInAction(() => this.GTINUpdateOnSubmit = true);
            setTimeout( () => {
                Alert.alert(
                    `Update Product Info`,
                    "We don't have all the info for this product! Since you are a Power User the Update Toggle has been activated. Please ensure all Product Info is entered correctly! Thank you for helping improve Kortermaster!",
                    [{ text: "OK", onPress: () => console.log("OK Pressed") }],
                    { cancelable: false }
                );
            }, 1000);
        }

        const spacer = (): JSX.Element => {
            return (
                <View style={{ height: this.spacerHeight }} />
            );
        }

        const cloudIcon = this.isCloudSyncing ? 'cloud-sync' : this.cardValidation() === "" ? "cloud-check" : "cloud-alert";

        return (
        <DismissKeyboard>
            <View>
                <View
                style={{
                    backgroundColor: '#787878',
                    borderRadius: 20,
                    paddingBottom: 10
                }}
                >
                    <View
                    style={{
                        flexDirection: "row",
                        alignSelf: 'center',
                        alignItems: 'center',
                        marginBottom: 2,
                        marginRight: 5
                    }}
                    >
                        <MaterialCommunityIcons name="eye-plus" size={30} color="black" style={{ height: 30 }} />
                        <Text
                        style={{
                            fontSize: 20,
                            marginTop: 4, 
                            left: 5
                        }}
                        >
                            Add Product Preview
                        </Text>
                    </View>
                    

                    <View
                    style={{
                        width: '95%',
                        alignSelf: 'center',
                        marginTop: 2,
                        marginBottom: 10,
                        height: 2,
                        backgroundColor: '#424242'
                    }}
                    />

                    <View
                    style={{
                        height: this.inventoryStore.getListItemHeight()
                    }}
                    >
                        <InventoryListItem
                            item={this.inventoryItem}
                            itemHeight={this.inventoryStore.getListItemHeight()}
                            isPreview={true}
                        />
                    </View>
                </View>
                

                {spacer()}
                
                <View
                style={{
                    backgroundColor: '#787878',
                    borderRadius: 20,
                    paddingBottom: 10
                }}
                >
                    <View
                        style={{
                            position: 'absolute',
                            transform: [{ scaleX: .7 }, { scaleY: .7 }],
                            right: 0,
                            flex: 1,
                            flexDirection: 'row',
                            display: this.inventoryStore.isGTINPowerUser ? 'flex' : 'none',
                        }}
                        >
                            <MaterialCommunityIcons name={"cloud-upload"} size={35} color='black'
                            style={{
                                marginRight: 10,
                                marginTop: -3
                            }}
                            />

                            <Switch
                            style={{
                                bottom: 2
                            }}
                            thumbColor={'#757575'}
                            trackColor={{
                                true: 'green',
                                false: '#757575'
                            }}
                            ios_backgroundColor={placeholderTextColor}
                            onValueChange={() => runInAction(() => {this.GTINUpdateOnSubmit = !this.GTINUpdateOnSubmit; this.inventoryStore.shouldAddGTINCache = this.GTINUpdateOnSubmit; this.didEnableGTINToggle = true}) }
                            value={this.GTINUpdateOnSubmit}
                            />
                    </View>

                    <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'center'
                    }}  
                    >
                        <MaterialCommunityIcons name="barcode" size={30} color={this.GTINUpdateOnSubmit ? 'gold':'black'} style={{ height: 27}} />
                        <Text
                        style={{
                            alignSelf: 'center',
                            marginBottom: -3,
                            fontSize: 20,
                            left: 3
                        }}
                        >
                            Product Info
                        </Text>
                    </View>
                    
                    <View
                    style={{
                        width: '95%',
                        alignSelf: 'center',
                        marginTop: 2,
                        marginBottom: 10,
                        height: 2,
                        backgroundColor: '#424242'
                    }}
                    >

                    </View>

                    <View
                    style={{
                        flexDirection: 'row',
                        height: 50
                    }}
                    >
                        <View
                        style={{
                            width: '33.3%',
                            flexDirection: 'column'
                        }}
                        >
                            {this.helpAlertByName('CapacityHelp', 
                                {
                                    position: 'absolute',
                                    top: -4,
                                    right: 4
                                }
                            )}

                            <Text
                            style={{
                                alignSelf: 'center',
                                bottom: 5,
                            }}
                            >
                                Capacity
                            </Text>

                            <TextInput
                            autoCorrect={false}
                            style={{
                                height: 40,
                                textAlign: 'center',
                                fontSize: 40,
                                bottom: 3,
                                color: this.inventoryItem?.measurement === foodMeasurement.count ? placeholderTextColor : 'black'
                            }}
                            maxLength={5}
                            //value={this.capacityReader}
                            ref={(ref) => this.capacityRef = ref}
                            editable={this.inventoryItem?.measurement === foodMeasurement.count ? false : true}
                            placeholder={this.inventoryItem?.capacity ? this.inventoryItem?.capacity.toString() : "?"}
                            placeholderTextColor={this.inventoryItem?.capacity ? 'black' : placeholderTextColor}
                            keyboardType={"decimal-pad"}
                            onFocus={() => {
                                this.capacityRef.setNativeProps({text: this.inventoryItem?.capacity.toString() ? this.inventoryItem.capacity : ""})
                            }}
                            onChangeText={(text) => this.nativeKeyboardReader = text.trim()}
                            onEndEditing={() => {
                                this.didJustChange = true;
                                if(this.nativeKeyboardReader) {
                                    runInAction(() => {
                                        this.inventoryItem.capacity = +this.nativeKeyboardReader;
                                        //console.warn("Closed Keyboard, Capacity in model: " + this.inventoryItem?.capacity);
                                    });
                                };
                                this.nativeKeyboardReader = null;
                            }}
                            />
                        </View>

                        <View
                        style={{
                            height: '85%',
                            alignSelf: 'center',
                            width: 1,
                            backgroundColor: '#999999'
                        }}
                        >
                        </View>

                        <View
                        style={{
                            width: '33.3%',
                            flexDirection: 'column'
                        }}
                        >
                            
                            {this.helpAlertByName("MeasurementHelp",
                            {
                                position: 'absolute',
                                top: -4,
                                right: 4
                            }
                            )}

                            <Text
                            style={{
                                alignSelf: 'center',
                                bottom: 5
                            }}
                            >
                                Measurement
                            </Text>
                            <View style={{ flex : 1}}>
                                <SectionedMultiSelect
                                items={TextUtils.foodMeasurementIndex(this.inventoryItem?.containersOnHand)}
                                iconRenderer={() => null}
                                renderSelectText={() => this.inventoryItem?.measurement == undefined ? "?" : TextUtils.foodMeasurement(+this.inventoryItem?.measurement, true)}
                                styles={{ searchTextInput:{ marginLeft: 10}, container:{alignSelf: 'center', flex: 0, height:'50%', width:'80%', marginTop: Dimensions.get('window').height/4 },  itemText: {fontSize: 20}, selectToggleText: {height: 40, fontSize: 40, lineHeight: 40, textAlign: 'center', marginBottom: this.inventoryItem?.measurement === foodMeasurement.g ? -8 : 0, color: this.inventoryItem?.measurement == undefined ? placeholderTextColor : 'black'}, selectToggle: {height: '100%'}}}
                                
                                showDropDowns={false}
                                uniqueKey="id"
                                displayKey="name"
                                ref={(component) => { runInAction(() => this.measurementMultiSelect = component) }}
                                onSelectedItemsChange={(items) => { runInAction(() => {
                                    this.didJustChange = true;
                                    this.inventoryItem.measurement = +items[0] as foodMeasurement;
                                    if(this.inventoryItem?.measurement === foodMeasurement.count) {
                                        runInAction(() => {
                                            this.inventoryItem.capacity = null;
                                            this.inventoryItem.storageFormat = null;
                                        });
                                    }
                                })}}
                                selectedItems={[this.inventoryItem?.measurement]}
                                single={true}
                                />
                            </View>
                        </View>

                        <View
                        style={{
                            height: '85%',
                            alignSelf: 'center',
                            width: 1,
                            backgroundColor: '#999999'
                        }}
                        >
                        </View>

                        <View
                        style={{
                            width: '33.3%',
                            flexDirection: 'column'
                        }}
                        >
                            <Text
                            style={{
                                alignSelf: 'center',
                                bottom: 5
                            }}
                            >
                                Format
                            </Text>

                            {this.helpAlertByName("FormatHelp",
                            {
                                position: 'absolute',
                                top: -4,
                                right: 12
                            }
                            )}

                            <View style={{ flex : 1}}>
                                <SectionedMultiSelect
                                items={TextUtils.storageFormatIndex(this.inventoryItem?.containersOnHand)}
                                iconRenderer={() => null}
                                renderSelectText={() => this.inventoryItem?.storageFormat == undefined ? "?" : TextUtils.storageFormat(this.inventoryItem?.storageFormat, this.inventoryItem?.containersOnHand)}
                                styles={{searchTextInput:{ marginLeft: 10}, container:{alignSelf: 'center', flex: 0, height:'80%', width:'80%', marginTop: Dimensions.get('window').height * .1 },  itemText: {fontSize: 20}, selectToggleText: {height: TextUtils.fontSizeForFormat(this.inventoryItem?.storageFormat), fontSize: TextUtils.fontSizeForFormat(this.inventoryItem?.storageFormat), lineHeight: TextUtils.fontSizeForFormat(this.inventoryItem?.storageFormat), textAlign: 'center', color: this.inventoryItem?.storageFormat == undefined ? placeholderTextColor : 'black', marginTop: TextUtils.fontSizeForFormat(this.inventoryItem?.storageFormat) < 40 ? 14 : 0}, selectToggle: {height: '100%'}}}
                                showDropDowns={false}
                                uniqueKey="id"
                                displayKey="name"
                                disabled={this.inventoryItem?.measurement === foodMeasurement.count ? true : false}
                                ref={(component) => { runInAction(() => this.storageFormatMultiSelect = component) }}
                                onSelectedItemsChange={(items) => { runInAction(() => {
                                    this.didJustChange = true;
                                    this.inventoryItem.storageFormat = +items[0] as storageFormat;
                                } )}}
                                selectedItems={[this.inventoryItem?.storageFormat]}
                                single={true}
                                />
                            </View>
                        </View>
                    </View>

                    <View
                    style={{
                        width: '95%',
                        alignSelf: 'center',
                        marginTop: 5,
                        marginBottom: 5,
                        height: 1,
                        backgroundColor: '#999999'
                    }}
                    />

                    <View>
                        <TextInput
                            autoCorrect={false}
                            style={{
                                height: 25,
                                textAlign: 'center',
                                fontSize: this.inventoryItem?.brand == undefined ? 22 : TextUtils.fontSizeForBrand(this.inventoryItem?.brand),
                                
                                textAlignVertical: 'bottom',
                                color: 'black',
                                width: '100%'
                            }}
                            numberOfLines={1}
                            maxLength={45}
                            //value={this.brand}
                            ref={(ref) => this.brandRef = ref}
                            placeholder={this.inventoryItem?.brand !== "brandless" ? this.inventoryItem?.brand : "Enter brand..."}
                            placeholderTextColor={this.inventoryItem?.brand !== "brandless" ? 'black' : placeholderTextColor}
                            onFocus={() => this.brandRef.setNativeProps({text: this.inventoryItem?.brand !== "brandless" ? this.inventoryItem.brand : ""})}
                            onChangeText={(text) => {!text ? "?" : this.nativeKeyboardReader = text.trim()}}
                            onEndEditing={() => {
                                this.didJustChange = true;
                                if(this.nativeKeyboardReader) {
                                    runInAction(() => {
                                        this.inventoryItem.brand = this.nativeKeyboardReader.trim();
                                        //console.warn("Closed Keyboard, Brand in model: " + this.inventoryItem?.brand);
                                    });
                                }
                                this.nativeKeyboardReader = null;
                            }}
                        />
                        
                        {this.helpAlertByName("BrandnameHelp",
                        {
                            position: 'absolute',
                            top: 2,
                            right: 8
                        })}
                    </View>
                    

                    <View
                    style={{
                        width: '95%',
                        alignSelf: 'center',
                        marginTop: 5,
                        marginBottom: 5,
                        height: 1,
                        backgroundColor: '#999999'
                    }}
                    />

                    <View
                    style={{
                        height: 20,
                        flexDirection: 'row'
                    }}
                    >
                        <View
                        style={{
                            width: '50%'
                        }}
                        >

                            {this.helpAlertByName("VarietyHelp", 
                            {
                                position: 'absolute',
                                top: 2,
                                left: 8,
                                zIndex: 10
                            }
                            )}

                            <TextInput
                            autoCorrect={false}
                            //value={this.variety}
                            ref={(ref) => this.varietyRef = ref}
                            placeholder={this.inventoryItem?.variety?.length > 0 && this.inventoryItem.variety != 'plain' ? this.inventoryItem?.variety : "Enter variety..."}
                            placeholderTextColor={this.inventoryItem?.variety?.length > 0 && this.inventoryItem.variety != 'plain' ? 'black' : placeholderTextColor}
                            maxLength={30}
                            style={{
                                flex: 1,
                                alignSelf: 'flex-end',
                                textAlignVertical: 'bottom',
                                fontSize: this.inventoryItem?.variety == undefined ? 20 : TextUtils.fontSizeForHalfWidthInput(this.inventoryItem?.variety),
                                top: 4,
                                //height: 30,
                                marginRight: 5
                            }}
                            onFocus={() => this.varietyRef.setNativeProps({text: this.inventoryItem?.variety  !== "plain" ? this.inventoryItem?.variety : ""})}
                            onChangeText={(text) => {
                                this.nativeKeyboardReader = text?.length === 0 ? "" : text.trim();
                                if(!this.nativeKeyboardReader) {
                                    runInAction(() => this.inventoryItem.variety = "plain");
                                    this.varietyRef.setNativeProps({text: ""});
                                }
                            }}
                            onEndEditing={() => {
                                this.didJustChange = true;
                                if(this.nativeKeyboardReader) {
                                    runInAction(() => {
                                        this.inventoryItem.variety = this.nativeKeyboardReader.trim();
                                        //("Closed Keyboard, Variety in model: " + this.inventoryItem?.variety);
                                    });
                                }
                                this.nativeKeyboardReader = null;
                            }}
                            />    
                            
                        </View>

                        <View
                        style={{
                            height: '100%',
                            alignSelf: 'center',
                            width: 1,
                            backgroundColor: '#999999',
                            marginTop: 10
                        }}
                        >
                        </View>

                        <View
                        style={{
                            width: '50%'
                        }}
                        >
                            <TextInput
                            autoCorrect={false}
                            style={{
                                flex: 1,
                                alignSelf: 'flex-start',
                                textAlignVertical: 'bottom',
                                fontSize: this.inventoryItem?.food?.length > 0 ? TextUtils.fontSizeForHalfWidthInput(this.inventoryItem?.food) : 20,
                                //height: 30,
                                top: 4,
                                marginLeft: 7
                            }}
                            
                            //value={this.food}
                            ref={(ref) => this.foodRef = ref}
                            placeholder={this.inventoryItem?.food ? this.inventoryItem?.food : "Enter name..."}
                            placeholderTextColor={this.inventoryItem?.food ? 'black' : placeholderTextColor}
                            maxLength={30}
                            onFocus={() => this.foodRef.setNativeProps({text: this.inventoryItem?.food})}
                            onChangeText={(text) => 
                                {
                                    this.nativeKeyboardReader = text?.length === 0 ? "" : text.trim();
                                    if(!this.nativeKeyboardReader) {
                                        runInAction(() => this.inventoryItem.food = "");
                                        this.varietyRef.setNativeProps({text: ""})
                                    }
                                }}
                            onEndEditing={() => {
                                this.didJustChange = true;
                                if(this.nativeKeyboardReader) {
                                    const metaData = this.inventoryMetadataStore.getMetadataByName(this.inventoryItem.food);
                                    runInAction(() => {
                                        this.inventoryItem.food = this.nativeKeyboardReader.trim();
                                        if(metaData) {
                                            this.inventoryItem.foodCategories = [metaData.category];
                                            switch(this.inventoryItem.storageLocation) {
                                                case storageLocation.Freezer:
                                                    this.inventoryItem.expiration = moment().add(metaData.averageLifeDaysFreezer, 'days').toDate();
                                                    break;
                                                case storageLocation.Refrigerator:
                                                        this.inventoryItem.expiration = moment().add(metaData.averageLifeDaysFridge, 'days').toDate();
                                                        break;
                                                default:
                                                    this.inventoryItem.expiration = moment().add(metaData.averageLifeDaysPantry, 'days').toDate();
                                                    break;
                                            }
                                        }
                                        
                                        if(this.inventoryItem?.containersOnHand <= 0) {
                                            this.inventoryItem.containersOnHand = 1;
                                        }

                                        //console.warn("Closed Keyboard, Food in model: " + this.inventoryItem?.food);
                                    });
                                }
                                this.nativeKeyboardReader = null;
                            }}
                            />

                            {this.helpAlertByName("FoodHelp",
                            {
                                position: 'absolute',
                                top: 0,
                                right: 8
                            }
                            )}

                        </View>
                    </View>

                    <View
                    style={{
                        width: '95%',
                        alignSelf: 'center',
                        top: 10,
                        marginBottom: 5,
                        height: 1,
                        backgroundColor: '#999999'
                    }}
                    />

                    <View
                    style={{
                        top: 10,
                        flexDirection: 'column'
                    }}
                    >
                        <View
                        >
                            <Text
                            style={{
                                textAlign: 'center'
                            }}
                            >Category</Text>

                            {this.helpAlertByName("CategoryHelp",
                            {
                                position: 'absolute',
                                top: 0,
                                right: 10
                            }
                            )}

                        </View>

                        <View style={{ flex : 1, top: -10, height: 35}}>
                            <SectionedMultiSelect
                            items={TextUtils.foodCategoryIndex()}
                            uniqueKey="id"
                            displayKey="name"
                            iconRenderer={() => null}
                            ref={(component) => { runInAction(() => this.categoryMultiSelect = component) }}
                            selectText={this.inventoryItem?.foodCategories?.length > 0 ? TextUtils.foodCategory(this.inventoryItem?.foodCategories[0]) : "Choose category..."}
                            styles={{ searchTextInput:{ marginLeft: 10}, container:{alignSelf: 'center', flex: 0, height:'80%', width:'80%', marginTop: Dimensions.get('window').height * .1 },  
                            selectToggleText: { textAlign: 'center', height: 20, lineHeight: 20 } }}
                            onSelectedItemsChange={(items) => { runInAction(() => {this.inventoryItem.foodCategories = items} ); this.didJustChange = true;}}
                            selectedItems={this.inventoryItem?.foodCategories?.length > 0 ? [this.inventoryItem?.foodCategories[0]] : [foodCategory.Other]}
                            single={true}
                            />
                        </View>     
                    </View>
                </View>

                {spacer()}

                <View
                style={{
                    backgroundColor: '#787878',
                    borderRadius: 20,
                    paddingBottom: 0
                }}
                >
                    <Text
                    style={{
                        alignSelf: 'center',
                        marginBottom: 2,
                        marginTop: 5,
                        fontSize: 20
                    }}
                    >
                        {TextUtils.randomChef()} My Product Info
                    </Text>

                    <View
                    style={{
                        width: '95%',
                        alignSelf: 'center',
                        marginTop: 2,
                        marginBottom: 10,
                        height: 2,
                        backgroundColor: '#424242'
                    }}
                    />

                    <View
                    style={{
                        height: 50,
                        flexDirection: 'row'
                    }}
                    >
                        <View 
                            style={{
                                width: '50%'
                            }}
                        >
                            <Text
                            style={{
                                textAlign: 'center',
                                bottom: 5
                            }}
                            >
                                Stored In
                            </Text>

                            {this.helpAlertByName("StorageHelp",
                            {
                                position: 'absolute',
                                top: -2,
                                right: 6
                            }
                            )}

                            <View style={{ flex : 1}}>
                                <SectionedMultiSelect
                                items={TextUtils.storageLocationIndex()}
                                iconRenderer={() => null}
                                renderSelectText={() => this.inventoryItem?.storageLocation == undefined ? "?" : TextUtils.storageLocation(+this.inventoryItem?.storageLocation) + " " + TextUtils.locationSymbol(+this.inventoryItem?.storageLocation, true)}
                                styles={{ searchTextInput:{ marginLeft: 10}, container:{alignSelf: 'center', flex: 0, height:'50%', width:'80%', marginTop: Dimensions.get('window').height/4 },  itemText: {fontSize: 20}, selectToggleText: {height: 40, marginBottom: this.inventoryItem?.storageLocation == undefined ? 0 : -8, fontSize: this.inventoryItem?.storageLocation == undefined ? 40 : 20, lineHeight: 40, textAlign: 'center', color: this.inventoryItem?.storageLocation == undefined ? placeholderTextColor : 'black'}, selectToggle: {height: '100%'}}}
                                showDropDowns={false}
                                uniqueKey="id"
                                displayKey="name"
                                ref={(component) => { runInAction(() => this.storageFormatMultiSelect = component) }}
                                onSelectedItemsChange={(items) => 
                                    { 
                                        runInAction(() => {
                                            this.inventoryItem.storageLocation = +items[0] as storageLocation;
                                            const metaData = this.inventoryMetadataStore.getMetadataByName(this.inventoryItem.food);
                                            if(metaData) {
                                                switch(this.inventoryItem.storageLocation) {
                                                    case storageLocation.Freezer:
                                                        this.inventoryItem.expiration = moment().add(metaData.averageLifeDaysFreezer, 'days').toDate();
                                                        break;
                                                    case storageLocation.Refrigerator:
                                                            this.inventoryItem.expiration = moment().add(metaData.averageLifeDaysFridge, 'days').toDate();
                                                            break;
                                                    default:
                                                        this.inventoryItem.expiration = moment().add(metaData.averageLifeDaysPantry, 'days').toDate();
                                                        break;
                                                }
                                            }
                                        } ); 
                                        this.didJustChange = true;
                                        
                                    }}
                                selectedItems={[this.inventoryItem?.storageLocation]}
                                single={true}
                                />
                            </View>
                        </View>

                        <View
                        style={{
                            height: '85%',
                            alignSelf: 'center',
                            width: 1,
                            backgroundColor: '#999999'
                        }}
                        >
                        </View>

                        <View 
                            style={{
                                width: '50%'
                            }}
                        >
                            <Text
                            style={{
                                textAlign: 'center',
                                bottom: 5
                            }}
                            >
                                On Hand
                            </Text>

                            {this.helpAlertByName("OnhandHelp",
                            {
                                position: 'absolute',
                                top: -2,
                                right: 10
                            }
                            )}

                            <View
                            style={{
                                flexDirection: 'row',
                                alignSelf: 'center'
                            }}
                            >
                                <Text
                                style={{
                                    alignSelf: 'center',
                                    right: 5
                                }}
                                onPress={() => this.quickChangeOnHand(false)}
                                >
                                    <Entypo name="circle-with-minus" size={30} color="#999999" />
                                </Text>

                                <TextInput
                                autoCorrect={false}
                                style={{
                                    height: 40,
                                    textAlign: 'center',
                                    fontSize: 40,
                                    marginTop: -5
                                }}
                                //value={this.containersOnHand?.toString()}
                                ref={(ref) => this.onHandRef = ref}
                                maxLength={6}

                                placeholder={this.inventoryItem?.containersOnHand ? this.inventoryItem?.containersOnHand?.toString() : "?"}
                                placeholderTextColor={this.inventoryItem?.containersOnHand ? 'black' : placeholderTextColor}
                                onFocus={() => this.onHandRef.setNativeProps({text: this.inventoryItem?.containersOnHand > 0 ? this.inventoryItem?.containersOnHand?.toString(): ""})}
                                keyboardType={"decimal-pad"}
                                onChangeText={(text) => {this.nativeKeyboardReader = text.trim()}}
                                onEndEditing={() => {
                                    this.didJustChange = true;
                                    if(this.nativeKeyboardReader) {
                                        runInAction(() => {
                                            this.inventoryItem.containersOnHand = Number.isNaN(+this.nativeKeyboardReader) ? 1 : +this.nativeKeyboardReader;
                                            //console.warn("Closed Keyboard, On Hand in model: " + this.inventoryItem?.containersOnHand);
                                        });
                                    }
                                    this.nativeKeyboardReader = null;
                                }}
                                />

                                <Text
                                style={{
                                    alignSelf: 'center',
                                    left: 5
                                }}
                                onPress={() => this.quickChangeOnHand() }
                                >
                                    <Entypo name="circle-with-plus" size={30} color="#999999" />
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View
                    style={{
                        width: '95%',
                        alignSelf: 'center',
                        marginTop: 5,
                        marginBottom: 5,
                        height: 1,
                        backgroundColor: '#999999'
                    }}
                    />

                    <View
                    >
                        <Text
                        style={{
                            textAlign: 'center'
                        }}
                        >Expiration
                        </Text>

                        {this.helpAlertByName("ExpirationHelp",
                        {
                            position: 'absolute',
                            top: 0,
                            right: 6,
                            zIndex: 10
                        }
                        )}

                        
                    </View>
                    
                    {this.platformDatePicker()}

                </View>

                

                {spacer()}

                <View
                style={{
                    flexDirection: 'row',
                    height: 40,
                    backgroundColor: '#5e5e5e',
                    borderRadius: 20,
                    marginLeft: 5,
                    marginRight: 5
                }}
                >
                    <View
                    style={{
                        width: '33.3%',
                        alignContent: 'center',
                        alignItems: 'center'
                    }}
                    >
                        <MaterialCommunityIcons name="backspace" size={34} color="black" style={{ height: 40, top: 3}} onPress={() => {
                            if(this.didJustChange) {
                                Alert.alert(
                                    "Unsynced Changes",
                                    "Your changes will be lost. Are you sure?",
                                    [
                                        {
                                            text: "No",
                                            style: 'cancel'
                                        },
                                        {
                                            text: "Yes",
                                            onPress: () => this.props.onBack()
                                        }
                                    ]
                                );
                            } else {
                                this.props.onBack()
                            }
                            
                        }} />
                    </View>

                    <View
                    style={{
                        height: '85%',
                        alignSelf: 'center',
                        width: 1,
                        backgroundColor: '#999999'
                    }}
                    />

                    <View
                    style={{
                        width: '33.3%',
                        alignContent: 'center',
                        alignItems: 'center'
                    }}
                    >
                        <Entypo name="trash" 
                        size={32} 
                        color="black" 
                        style={{ height: 36, top: 4}}
                        onPress={ () => {
                            if(!this.isEditing) {
                                if(this.didJustChange) {
                                    Alert.alert(
                                        "Unsynced Changes",
                                        "Your changes will be lost. Are you sure?",
                                        [
                                            {
                                                text: "No",
                                                style: 'cancel'
                                            },
                                            {
                                                text: "Yes",
                                                onPress: () => this.props.onBack()
                                            }
                                        ]
                                    );
                                } else {
                                    this.props.onBack();
                                }
                            } else {
                                Alert.alert(
                                    "Toss Item",
                                    "The item will be tossed and your personal Product Info will be lost. Are you sure?",
                                    [
                                        {
                                            text: "No",
                                            style: 'cancel'
                                        },
                                        {
                                            text: "Yes",
                                            onPress: async () => {runInAction(() => this.isCloudSyncing = true); await this.props.onRemove(); runInAction(() => this.isCloudSyncing = false);}
                                        }
                                    ]
                                );
                            }

                            }} />
                    </View>

                    <View
                    style={{
                        height: '85%',
                        alignSelf: 'center',
                        width: 1,
                        backgroundColor: '#999999'
                    }}
                    >
                    </View>

                    <View
                    style={{
                        width: '33.3%',
                        alignContent: 'center',
                        alignItems: 'center'
                    }}
                    >
                        <MaterialCommunityIcons name={cloudIcon} size={42} color='black' onPress={ async () => {
                            // if no changes
                            if(!this.didJustChange && this.isEditing) {
                                this.props.onBack();
                                return;
                            }
                            const cardValidation = this.cardValidation();
                            if(cardValidation === "") {
                                runInAction(() => this.isCloudSyncing = true);
                                await this.props.onSubmit(this.GTINUpdateOnSubmit);
                                runInAction(() => this.isCloudSyncing = false);
                            } else {
                                Alert.alert(
                                    `Invalid ${cardValidation}`,
                                    "You've left out some valuable details. Please check your entries again!",
                                    [{ text: "OK" }],
                                    { cancelable: false }
                                );
                            }
                            
                            }} />
                    </View>
                </View>

                <View
                style={{
                    width: 0,
                    height: 0
                }}
                onLayout={this.onVerticalExtentLayout}
                />

            </View>

        </DismissKeyboard>
        );
    }
}