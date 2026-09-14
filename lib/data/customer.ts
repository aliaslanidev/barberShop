export interface Customer {
  id: string;
  name: string;
  phone: string;
}

// TODO: وقتی auth واقعی وصل شد، این باید از session بیاد نه از یه ثابت
export const currentCustomer: Customer = {
  id: "c1",
  name: "علی محمدی",
  phone: "09123456789",
};