/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createItem = /* GraphQL */ `
  mutation CreateItem(
    $input: CreateItemInput!
    $condition: ModelItemConditionInput
  ) {
    createItem(input: $input, condition: $condition) {
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
export const updateItem = /* GraphQL */ `
  mutation UpdateItem(
    $input: UpdateItemInput!
    $condition: ModelItemConditionInput
  ) {
    updateItem(input: $input, condition: $condition) {
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
export const deleteItem = /* GraphQL */ `
  mutation DeleteItem(
    $input: DeleteItemInput!
    $condition: ModelItemConditionInput
  ) {
    deleteItem(input: $input, condition: $condition) {
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
export const createGtin = /* GraphQL */ `
  mutation CreateGtin(
    $input: CreateGTINInput!
    $condition: ModelGTINConditionInput
  ) {
    createGTIN(input: $input, condition: $condition) {
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
export const updateGtin = /* GraphQL */ `
  mutation UpdateGtin(
    $input: UpdateGTINInput!
    $condition: ModelGTINConditionInput
  ) {
    updateGTIN(input: $input, condition: $condition) {
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
export const deleteGtin = /* GraphQL */ `
  mutation DeleteGtin(
    $input: DeleteGTINInput!
    $condition: ModelGTINConditionInput
  ) {
    deleteGTIN(input: $input, condition: $condition) {
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
