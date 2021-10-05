/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getItem = /* GraphQL */ `
  query GetItem($id: ID!) {
    getItem(id: $id) {
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
export const listItems = /* GraphQL */ `
  query ListItems(
    $filter: ModelItemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listItems(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
    }
  }
`;
export const getGtin = /* GraphQL */ `
  query GetGtin($id: ID!) {
    getGTIN(id: $id) {
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
export const listGtiNs = /* GraphQL */ `
  query ListGtiNs(
    $filter: ModelGTINFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGTINs(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
    }
  }
`;
