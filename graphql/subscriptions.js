/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateItem = /* GraphQL */ `
  subscription OnCreateItem($owner: String!) {
    onCreateItem(owner: $owner) {
      id
      food
      measurement
      storageLocation
      containersOnHand
      foodCategories
      capacity
      storageFormat
      brand
      variety
      expiration
      lastUpdated
      owner
    }
  }
`;
export const onUpdateItem = /* GraphQL */ `
  subscription OnUpdateItem($owner: String!) {
    onUpdateItem(owner: $owner) {
      id
      food
      measurement
      storageLocation
      containersOnHand
      foodCategories
      capacity
      storageFormat
      brand
      variety
      expiration
      lastUpdated
      owner
    }
  }
`;
export const onDeleteItem = /* GraphQL */ `
  subscription OnDeleteItem($owner: String!) {
    onDeleteItem(owner: $owner) {
      id
      food
      measurement
      storageLocation
      containersOnHand
      foodCategories
      capacity
      storageFormat
      brand
      variety
      expiration
      lastUpdated
      owner
    }
  }
`;
export const onCreateGtin = /* GraphQL */ `
  subscription OnCreateGtin {
    onCreateGTIN {
      id
      IMG
      M_G
      M_OZ
      M_FLOZ
      BSIN_id
      GTIN_NM
      GPC_S_CD_id
      GPC_F_CD_id
      GPC_C_CD_id
      GPC_B_CD_id
      K_PACKAGE
      K_CATEGORY
    }
  }
`;
export const onUpdateGtin = /* GraphQL */ `
  subscription OnUpdateGtin {
    onUpdateGTIN {
      id
      IMG
      M_G
      M_OZ
      M_FLOZ
      BSIN_id
      GTIN_NM
      GPC_S_CD_id
      GPC_F_CD_id
      GPC_C_CD_id
      GPC_B_CD_id
      K_PACKAGE
      K_CATEGORY
    }
  }
`;
export const onDeleteGtin = /* GraphQL */ `
  subscription OnDeleteGtin {
    onDeleteGTIN {
      id
      IMG
      M_G
      M_OZ
      M_FLOZ
      BSIN_id
      GTIN_NM
      GPC_S_CD_id
      GPC_F_CD_id
      GPC_C_CD_id
      GPC_B_CD_id
      K_PACKAGE
      K_CATEGORY
    }
  }
`;
