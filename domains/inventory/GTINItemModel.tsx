import { serializable, primitive } from 'serializr';

export interface IGTIN {
    GTIN_CD: string,
    IMG?: number,
    M_G?: number,
    M_OZ?: number,
    M_FLOZ?: number,
    BSIN_id?: string,
    GTIN_NM?: string,
    GPC_S_CD_id?: string,
    GPC_F_CD_id?: string,
    GPC_C_CD_id?: string,
    GPC_B_CD_id?: string,
    K_PACKAGE: number,
    K_CATEGORY: number
}

export class GTINItemModel implements IGTIN {

    @serializable(primitive())
    GTIN_CD: string;

    @serializable(primitive())
    IMG: number;

    @serializable(primitive())
    M_G: number;

    @serializable(primitive())
    M_OZ: number;

    @serializable(primitive())
    M_FLOZ: number;

    @serializable(primitive())
    BSIN_id: string;

    @serializable(primitive())
    GTIN_NM: string;

    @serializable(primitive())
    GPC_S_CD_id: string;

    @serializable(primitive())
    GPC_F_CD_id: string;

    @serializable(primitive())
    GPC_C_CD_id: string;

    @serializable(primitive())
    GPC_B_CD_id: string;

    @serializable(primitive())
    K_PACKAGE: number;

    @serializable(primitive())
    K_CATEGORY: number;

    constructor(item: IGTIN) {
        this.update(item);
    }

    update(item: IGTIN): void {
        Object.assign(this, item);
    }

}