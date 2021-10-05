import React, { Component } from 'react';
import { IInventoryItemModel } from './InventoryItemModel';
import { View, Text, TouchableHighlight, Dimensions, StyleSheet, Platform } from 'react-native';
import { TextUtils } from "../../utils/Text";
import { Avatar } from 'react-native-elements';
import LinearGradient from 'react-native-linear-gradient';
import { IInventoryMetadataStore, IItemMetadata, IShelfLifeMetadata } from '../../domains/inventory/InventoryMetadataStore';
import { lazyInject } from '../../../DependencyContainer';
import { DomainTypes } from '../../../Types';
import DeviceInfo from 'react-native-device-info';
import { observable, runInAction, action } from "mobx";
import { StyleCache } from "../../utils/StyleCache";

const isTablet = DeviceInfo.isTablet();

interface IProps {
    item: IInventoryItemModel;
    itemHeight: number;
    navigation?: any;
    isPreview?: boolean;
}

export class InventoryListItem extends Component<IProps> {
    @lazyInject(DomainTypes.InventoryMetadata) private inventoryMetadataStore: IInventoryMetadataStore;

    @observable
    avatarWidth: number;

    // this should dictate the entire height of the list item
    @observable
    avatarHeight: number;

    @observable
    item: IInventoryItemModel;
    itemMetadata: IItemMetadata;
    shelfLifeMetadata: IShelfLifeMetadata;
    friendlyTitleSize: number;

    onAvatarLayout = (e: any) => {
        if(this.avatarHeight !== e.nativeEvent.layout.width/* ||
        this.avatarHeight !== e.nativeEvent.layout.height*/) {
        runInAction(() => {
            this.avatarWidth = e.nativeEvent.layout.width;
            //this.avatarHeight = e.nativeEvent.layout.height;
        });
        this.forceUpdate();
        }
    }

    onPressEdit = (itemToEdit: IInventoryItemModel): void => {
        // TODO abort if is preview
        if(!this.props.isPreview) {
            this.props.navigation?.navigate("Edit", { editItemId: itemToEdit.id });
        }
    }

    @action
    async componentDidMount() {
      this.item = this.props.item;
      this.itemMetadata = await this.inventoryMetadataStore.getMetadataByItem(this.item);
      this.shelfLifeMetadata = await this.inventoryMetadataStore.getShelfLifeMetadataByItem(this.item);
      this.friendlyTitleSize = TextUtils.fontSizeForTitle(TextUtils.friendlyExpression(this.item, true));
    }

    @action
    async updateMetadata() {
      this.itemMetadata = await this.inventoryMetadataStore.getMetadataByItem(this.item);
      this.shelfLifeMetadata = await this.inventoryMetadataStore.getShelfLifeMetadataByItem(this.item);
      this.friendlyTitleSize = TextUtils.fontSizeForTitle(TextUtils.friendlyExpression(this.item, true));
    }

    render() {
      this.updateMetadata();
        const listItemStyles = StyleSheet.create({
            cornerBackgroundColor: {
                backgroundColor: this.item?.foodCategories?.length > 0 ? this.inventoryMetadataStore?.getCategoryColor(this.item?.foodCategories[0]) : 'white',
            },
            avatarColors: {
                borderBottomColor: this.itemMetadata?.borderColor || 'black',
                borderRightColor: this.itemMetadata?.borderColor || 'black',
                borderTopColor: this.itemMetadata?.borderColor || 'black',
                backgroundColor: this.itemMetadata?.backgroundColor || 'black',
                borderStartColor: this.inventoryMetadataStore?.getCategoryColor(this.item?.foodCategories?.length > 0 ? this.item?.foodCategories[0] : undefined),
            },
            expirationColor: {
                borderColor: this.shelfLifeMetadata?.color || 'black',
            },
            expirationTextShadow: {
                textShadowOffset: { width: 2, height: 2 },
                textShadowRadius: 5,
                textShadowColor: this.shelfLifeMetadata?.color || 'black',
            }
        });

        return (
            <View
            style={[dynamicStyles.getOrCreateStyle().listItemContiner, {height: this.props.itemHeight}]}
            >
                <View
                onLayout={this.onAvatarLayout}
                style={{height: this.props.itemHeight}}
                >
                    <Avatar 
                    rounded 
                    title={this.itemMetadata?.symbol || "?"}
                    onPress={() => this.onPressEdit(this.item)}
                    containerStyle={dynamicStyles.getOrCreateStyle().avatarContainer}
                    size={ isTablet ? "xlarge" : "large"}
                    titleStyle={ isTablet ? dynamicStyles.getOrCreateStyle().tabletAvatarSymbol : dynamicStyles.getOrCreateStyle().avatarSymbol}
                    overlayContainerStyle={[listItemStyles.avatarColors, isTablet ? dynamicStyles.getOrCreateStyle().tabletAvatarOverlay :  dynamicStyles.getOrCreateStyle(0, this.props.itemHeight).avatarOverlay]}
                    />
                </View>
                <View style={[dynamicStyles.getOrCreateStyle().expirationContainerRow, {height: this.props.itemHeight}]}>
                    <View style={dynamicStyles.getOrCreateStyle().expirationContainerCol}>
                        <Avatar 
                        rounded 
                        title={this.shelfLifeMetadata?.symbol || "?"}
                        containerStyle={dynamicStyles.getOrCreateStyle().expirationAvatarContainer}
                        size={isTablet ? "medium" : "small"}
                        titleStyle={dynamicStyles.getOrCreateStyle().expirationAvatarSymbol}
                        overlayContainerStyle={[listItemStyles.expirationColor, dynamicStyles.getOrCreateStyle(0, this.props.itemHeight).expirationAvatarOverlay]}
                        />
                    </View>
                </View>
                <TouchableHighlight
                style={{
                  height: this.props.itemHeight
                }}
                onPress={() => this.onPressEdit(this.item)}
                >
                    <View
                    style={dynamicStyles.getOrCreateStyle(this.avatarWidth).listingContainer}
                    >
                        <LinearGradient 
                        start={{x: 0, y: 0}} 
                        end={{x: 1, y: 0}} 
                        colors={[
                            this.itemMetadata?.backgroundColor || 'black',
                            this.inventoryMetadataStore?.getCategoryColor(this.item?.foodCategories?.length > 0 ? this.item?.foodCategories[0] : undefined)
                        ]}
                        style={dynamicStyles.getOrCreateStyle().gradientStyle}>
                            <View style={dynamicStyles.getOrCreateStyle(0, 0, null, null, this.inventoryMetadataStore?.getCategoryColor(this.item?.foodCategories?.length > 0 ? this.item?.foodCategories[0] : undefined)).separator}
                            />
                        </LinearGradient>
                        
                        <View
                        style={[listItemStyles.cornerBackgroundColor, dynamicStyles.getOrCreateStyle(0, 0, this.itemMetadata).corner]}
                        >
                        </View>
                        <View
                        style={dynamicStyles.getOrCreateStyle().categorySymbolContainer}
                        >
                            <Text
                            style={dynamicStyles.getOrCreateStyle().cornerText}>
                            {this.inventoryMetadataStore?.getCategorySymbol(this.item?.foodCategories && this.item?.foodCategories?.length > 0 ? this.item?.foodCategories[0] : undefined)}
                            </Text>
                        </View>
                        
                        <View
                        style={ isTablet ? dynamicStyles.getOrCreateStyle(Math.round(Dimensions.get('window').width - this.avatarWidth) || 0, this.props.itemHeight).tabletFriendlyTitleContainer : dynamicStyles.getOrCreateStyle(Math.round(Dimensions.get('window').width - this.avatarWidth) || 0, this.props.itemHeight).friendlyTitleContainer}
                        >
                            <Text
                            numberOfLines={1}
                            style={dynamicStyles.getOrCreateStyle(0, 0, null, null, null, this.friendlyTitleSize).friendlyTitleText}
                            ellipsizeMode="tail"
                            >
                                {TextUtils.friendlyExpression(this.item, true)}
                            </Text>
                        </View>
                        <View
                        style={dynamicStyles.getOrCreateStyle(Math.round(Dimensions.get('window').width - this.avatarWidth) || 0, this.props.itemHeight).mainTextContainer}
                        >
                            <View
                            style={dynamicStyles.getOrCreateStyle().shelfLifeTextStack}
                            >
                                <Text
                                style={[listItemStyles.expirationTextShadow, dynamicStyles.getOrCreateStyle().expirationText]}
                                >
                                    {this.shelfLifeMetadata?.name || "?"}
                                </Text>
                                <Text
                                style={dynamicStyles.getOrCreateStyle().expirationText}
                                >
                                    {this.shelfLifeMetadata?.expiresInMessage || "?"}
                                </Text>
                            </View>
                            
                            <View
                            style={dynamicStyles.getOrCreateStyle().updatedQuantityTextStack}
                            >
                                <View
                                style={dynamicStyles.getOrCreateStyle().updatedContainer}
                                >
                                    <Text
                                    style={dynamicStyles.getOrCreateStyle().updatedText}
                                    >
                                        {TextUtils.makeDaysSinceUpdatedString(this.inventoryMetadataStore?.getDaysSinceUpdated(this.item?.lastUpdated))}
                                    </Text>
                                </View>
                                <View
                                style={dynamicStyles.getOrCreateStyle().totalQuantityContainer}
                                >
                                    <Text
                                    style={dynamicStyles.getOrCreateStyle().totalQuantityText}
                                    >
                                        {TextUtils.makeTotalItemQuantityString(this.item)}
                                    </Text>
                                </View>
                            </View>
                            
                        </View>
                        
                    </View>
                </TouchableHighlight>
                
            </View>
                            
        )
    }

}

const dynamicStyles = new StyleCache((
    width?: number, 
    height?: number, 
    itemMetadata?: IItemMetadata, 
    shelfLifeMetadata?: IShelfLifeMetadata, 
    categoryColor?: string, 
    friendlyTitleSize?:number
    ) => {

    return {
      separator: {
        width: '100%',
        height: isTablet ? 30 : 15,
        //color: '#ffffff',
        //backgroundColor: 'transparent',
        backgroundColor: categoryColor,
        borderColor: 'transparent',
        borderWidth: isTablet ? 5 : 3,
        borderRadius: isTablet ? 30 : 10,
        flex: 1,
        flexDirection: 'row-reverse',
        alignSelf: 'center'

        //backgroundColor: categoryColor
      },
      gradientStyle: {
        borderWidth: isTablet ? 5 : 3,
        borderRadius: isTablet ? 30 : 10,
        height: isTablet ? 40 : (Platform.OS === 'ios') ? 22 : 26,
        borderColor: 'transparent'
      },
      listItemContiner: {
        flex: 1, 
        flexDirection: 'row',
        marginBottom: 0,
        height: height
      },
      avatarContainer: {
        margin: isTablet ? 10 : 5,
        marginTop: 5
      },
      avatarSymbol: {
        fontSize: 45,
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: {width: -1, height: -1},
        textShadowRadius: 5
      },
      tabletAvatarSymbol: {
        fontSize: 90,
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: {width: 1, height: 1},
        textShadowRadius: 7
      },
      avatarOverlay: {
        borderWidth: 5,
        borderStyle: 'solid',
        borderTopStartRadius: 10,
        borderBottomEndRadius: 10,
        borderBottomLeftRadius: 30,
        borderStartWidth: 10,
        height: height
      },
      tabletAvatarOverlay: {
        borderWidth: 5 * 2,
        borderStyle: 'solid',
        borderTopStartRadius: 10 * 2,
        borderBottomEndRadius: 10 * 2,
        borderBottomLeftRadius: 30 * 2,
        borderStartWidth: 10 * 2
      },
      expirationContainerRow: {
        flex: 1,
        flexDirection: 'row-reverse',
        left: -30
      },
      expirationContainerCol: {
        flex: 1,
        flexDirection: 'column-reverse',
      },
      expirationAvatarContainer: {
        margin: isTablet ? -12 : 5,
        marginBottom: isTablet ? 2 : 0
      },
      expirationAvatarSymbol: {
        fontSize: isTablet ? 35 : 20,
        top: (Platform.OS === 'ios') ? 1 : 0,
        left: (Platform.OS === 'ios') ? 1 : 0,
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: {width: -1, height: -1},
        textShadowRadius: 5
      },
      expirationAvatarOverlay: {
        backgroundColor: "#deffcf",
        borderWidth: isTablet ? 5 : 3,
        height: height
      },
      expirationText: {
        bottom: 0,
        left: isTablet ? 10 : 0,
        fontSize: isTablet ? 60 : 25,
        fontFamily: (Platform.OS === 'ios') ? 'SimplePrint-Regular' : `Simple-Print`,
      },
      listingContainer: {
        width: Math.round(Dimensions.get('window').width - width) || 0
      },
      corner: {
        position: 'absolute',
        right: 0,
        height: (Platform.OS === 'ios') ? '100%' : '76%',
        bottom: (Platform.OS === 'ios') ? 0 : 3,
        width: isTablet ? 20 : 10,
      },
      categorySymbolContainer: {
      position: 'absolute',
        right: 3,
        bottom: (Platform.OS === 'ios') ? 2 : 5,
      },
      cornerText: {
        fontSize: isTablet ? 30 : 14
      },
      cornerTransparent: {
        backgroundColor: '#c9c9c9',
        bottom: 38,
        left: 30,
        height: 70,
        width: 30,
        transform: [
            {rotate: '45deg'}
        ]
      },
      friendlyTitleContainer: {
        position: 'absolute',
        top: (Platform.OS === 'ios') ? 4 : 6,
        left: (Platform.OS === 'ios') ? 1 : 3,
        width: width,
        marginRight: 10,
      },
      tabletFriendlyTitleContainer: {
        position: 'absolute',
        top: (Platform.OS === 'ios') ? 4 : 6,
        left: (Platform.OS === 'ios') ? 1 : 3,
        width: width,
        marginRight: 10,
      },
      friendlyTitleText: {
        position: 'absolute',
        fontSize: isTablet ? 25 : 12,//friendlyTitleSize,
        marginRight: 20,
        marginLeft: isTablet ? 15 : 8,
        top: -1,
        fontFamily: 'Timeless-Bold'
      },
      mainTextContainer: {
        position: 'absolute',
        height: height,
        width: width
      },
      shelfLifeTextStack: {
        position: 'absolute',
        bottom: 8,
        left: 14,
        height: height
      },
      updatedQuantityTextStack: {
        position: 'absolute',
        width: width,
        height: height,
        right: 5,
        bottom: 8
      },
      updatedContainer: {
        flex: 1,
        flexDirection: 'row-reverse',
      },
      updatedText: {
        fontSize: isTablet ? 25 : 12,
        fontFamily: 'Timeless-Normal',
      },
      totalQuantityContainer: {
        flex: 1,
        flexDirection: 'row-reverse',
      },
      totalQuantityText: {
        fontSize: isTablet ? 25 : 12,
        fontFamily: 'Timeless-Normal'
      }
      
    };
  });