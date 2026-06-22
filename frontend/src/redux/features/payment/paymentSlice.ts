import { createSlice } from "@reduxjs/toolkit";

interface PaymentState {
  earnings: {
    totalEarnings: number;
    monthlyEarnings: number;
    yearlyEarnings: number;
    weeklyEarnings: number;
    enrolledStudents: number;
  } | null;
  isStripeConnected: boolean;
}

const initialState: PaymentState = {
  earnings: null,
  isStripeConnected: false,
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    setEarnings: (state, action) => {
      state.earnings = action.payload;
    },
    setStripeConnection: (state, action) => {
      state.isStripeConnected = action.payload;
    },
  },
});

export const { setEarnings, setStripeConnection } = paymentSlice.actions;
export default paymentSlice.reducer;
