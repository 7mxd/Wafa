/** A user's (optional) bank payment details, shared with a borrower on an active
 *  loan so they can repay. Kept in its own module (not the "use server" actions
 *  file) so client components can import the type freely. */
export type PaymentDetails = {
  iban: string | null;
  account_holder_name: string | null;
  bank_name: string | null;
  account_number: string | null;
  swift_bic: string | null;
};

export const EMPTY_PAYMENT_DETAILS: PaymentDetails = {
  iban: null,
  account_holder_name: null,
  bank_name: null,
  account_number: null,
  swift_bic: null,
};
