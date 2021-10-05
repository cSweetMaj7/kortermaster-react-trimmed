import React, { Component } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RNCamera } from 'react-native-camera';
import { IInventoryStore } from 'domains/inventory/InventoryStore';
import { lazyInject } from '../../../DependencyContainer';
import { DomainTypes } from '../../../Types';

interface IProps {
  navigation: any;
  route: any;
};

const isEmulator = false;//DeviceInfo.isEmulatorSync();

export class CaptureBarcode extends Component<IProps> {

  @lazyInject(DomainTypes.Inventory) private inventoryStore: IInventoryStore;

  private lastCapturedGTIN: string;
  private isCapturing: boolean;

  PendingView = () => (
    <View
      style={{
        flex: 1,
        backgroundColor: 'lightgreen',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <TouchableOpacity onPress={() => this.props.navigation.navigate("Add")} style={styles.capture}>
        <Text style={{ fontSize: 14 }}> Cancel </Text>
      </TouchableOpacity>
    </View>
  );

  
  onBarcode = async (data) => {
    if(this.isCapturing) {
      // wait until complete
      return;
    }
    this.isCapturing = true;
    const GTIN_CD:string = data?.data;
    if(GTIN_CD) {
      if(this.lastCapturedGTIN === GTIN_CD) {
        // no need to do this more than once, abort
        return;
      }
      await this.inventoryStore.lookupGTIN(GTIN_CD);
      this.lastCapturedGTIN = GTIN_CD;
    } else {
      // console.warn("No GTIN data from scan!");
    }
    this.props.navigation.navigate("Add", { scannedGTIN: GTIN_CD });
    this.isCapturing = false;
  }

  render() {
    if(isEmulator) {
      // scan the debug barcode instead of pulling up the camera
      // const debugGTIN = "0044000027346"; // 11oz box of nabisco (kraft) nilla wafers
      const debugGTIN = "0085239012376"; // 6.5 oz grinder of simply balanced himalayan pink salt
      // const debugGTIN = "0041617002216"; // 4oz can of Rumford Reduced Sodium Baking Power
      // const debugGTIN = "0041617002216";

      const data = {
        data: debugGTIN
      }
      this.onBarcode(data);
    }
    return (
      <View style={styles.container}>
        <RNCamera
          style={styles.preview}
          type={RNCamera.Constants.Type.back}
          captureAudio={false}
          onBarCodeRead={(data) => this.onBarcode(data)}
          androidCameraPermissionOptions={{
            title: 'Need Camera Permission',
            message: 'The camera will scan barcodes to collect product information. Is that alright?',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
        >
          {({ camera, status }) => {
            if (status !== 'READY') return <this.PendingView />;
            return (
              <View style={{ flex: 0, flexDirection: 'row', justifyContent: 'center' }}>
                <TouchableOpacity onPress={() => this.onCancel(camera)} style={styles.capture}>
                  <Text style={{ fontSize: 14 }}> Cancel </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        </RNCamera>
      </View>
    );
  }

  onCancel = async function(camera) {
    this.props.navigation.navigate("Add");
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    margin: 20,
  },
});
