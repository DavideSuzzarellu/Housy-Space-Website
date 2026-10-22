/** Confirmed company data (AGENTS.md §1). Never add unconfirmed fields here. */
export interface CompanyAddress {
  readonly street: string;
  readonly postalCode: string;
  readonly city: string;
}

export interface Company {
  readonly legalName: string;
  readonly brandName: string;
  readonly taxId: string;
  readonly aicatNumber: string;
  readonly address: CompanyAddress;
}

export const COMPANY: Company = {
  legalName: "HousySpace Consultores Inmobiliarios, S.L.",
  brandName: "HousySpace · Property Solutions",
  taxId: "B26903419",
  aicatNumber: "14032",
  address: {
    street: "Travessera de Gràcia 73, 2.º 3.ª",
    postalCode: "08006",
    city: "Barcelona",
  },
};
