import React, { Component } from "react";
import { SafeAreaView, View, Text, TouchableHighlight } from 'react-native';
import { FlatList } from "react-native-gesture-handler";
import { lazyInject } from '../DependencyContainer';
import { DomainTypes } from '../Types';
import { IInventoryStore } from './domains/inventory/InventoryStore';
import { StyleCache } from "./utils/StyleCache";
import { observer } from "mobx-react";
import { InventoryListItem } from './domains/inventory/InventoryListItem';
import {  } from '../App';

interface IProps {
  navigation: any;
  route: any;
};

@observer
export class InventoryListScreen extends Component<IProps> {
    @lazyInject(DomainTypes.Inventory) private inventoryStore: IInventoryStore;

    async componentDidMount() {
      if(this.props.route?.params?.resync) {
          await this.inventoryStore.resync();
      }
    }

    componentDidCatch(error: any, info: any) {
      console.error(error, info);
    }

    onPressAdd = () => {
         this.props.navigation.navigate("Camera");
        //this.props.navigation.navigate("Add");
    }

    onPressRemoveAll = () => {
        this.inventoryStore.clearItems();
    }

    render() {
        return (  
            <SafeAreaView
            style={dynamicStyles.getOrCreateStyle().screenContainer}>
                <View
                style={dynamicStyles.getOrCreateStyle().buttonBarContainer}
                >
                    <TouchableHighlight
                    style={dynamicStyles.getOrCreateStyle().addButton}
                    onPress={this.onPressAdd}
                    >
                        <Text
                        style={dynamicStyles.getOrCreateStyle().addText}
                        >
                        Add
                        </Text>
                    </TouchableHighlight>
                    <TouchableHighlight
                    style={dynamicStyles.getOrCreateStyle().removeAllButton}
                    onPress={this.onPressRemoveAll}
                    >
                        <Text
                        style={dynamicStyles.getOrCreateStyle().removeAllText}
                        >
                        Remove All
                        </Text>
                    </TouchableHighlight>
                    <TouchableHighlight
                    style={dynamicStyles.getOrCreateStyle().logOutButton}
                    onPress={async () => {
                      this.inventoryStore.signOut();
                      await this.props.navigation.replace("SignOut");
                      
                      //this.props.navigation.reset();
                    }}
                    >
                        <Text
                        style={dynamicStyles.getOrCreateStyle().removeAllText}
                        >
                        Log Out
                        </Text>
                    </TouchableHighlight>
                </View>
                
                <View>
                    <FlatList
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={this.inventoryStore.currentInventoryItems.size < 8 ? false : true}
                    style={dynamicStyles.getOrCreateStyle().flatListMargin}
                    data={Array.from(this.inventoryStore.currentInventoryItems.values()).slice(0)}
                    renderItem={({ item }) => {
                      return (
                        <InventoryListItem
                        item={item}
                        itemHeight={this.inventoryStore.getListItemHeight()}
                        navigation={this.props.navigation}
                        />
                      );    
                    }}
                    keyExtractor={item => item.id}
                    >

                    </FlatList>
                </View>
            </SafeAreaView>  
        );
    }
}

const dynamicStyles = new StyleCache(() => {
    return {
      addButton: {
        borderRadius: 12,
        backgroundColor: 'blue',
        maxHeight: 30,
        width: 80,
        left: 5,
        marginLeft: 10
      },
      addText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 26,
        bottom: 3,
        marginLeft: 14,
        lineHeight: 35,
      },
      removeAllButton: {
        borderRadius: 12,
        backgroundColor: 'red',
        maxHeight: 30,
        width: 126,
        left: 5,
        marginLeft: 10
      },
      logOutButton: {
        borderRadius: 12,
        backgroundColor: 'orange',
        maxHeight: 30,
        width: 98,
        left: 5,
        marginLeft: 10
      },
      removeAllText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 18,
        bottom: 3,
        marginLeft: 14,
        lineHeight: 35,
      },
      screenContainer: {
        backgroundColor: '#c9c9c9',
      },
      buttonBarContainer: {
        flex: 1,
        flexDirection: 'row',
        minHeight: 35
      },
      flatListMargin: {
        marginBottom: 0 // TODO hack
      }
    };
  });