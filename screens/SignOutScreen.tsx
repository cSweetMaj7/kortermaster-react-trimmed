import { Component } from 'react';
import Auth from '@aws-amplify/auth';
import { DomainTypes } from '../../Types';
import { lazyInject } from '../../DependencyContainer';
import { IInventoryStore } from '../domains/inventory/InventoryStore';

interface IProps {
  navigation: any;
  route: any;
};

export class SignOutScreen extends Component<IProps> {
  @lazyInject(DomainTypes.Inventory) private inventoryStore: IInventoryStore;

  checkDidLogin() {
    setTimeout(async () => {
      try {
        await Auth.currentAuthenticatedUser();
        this.inventoryStore.resync();
      } catch {
        this.checkDidLogin();
      }
    }, 1000);
  }

  componentDidMount() {
    this.checkDidLogin();
  }

  render(): JSX.Element {
    return null;
  }

}