import React from "react";
import { Provider } from "react-redux";
import { store } from "../../shared/services/store";

export const StoreProvider = ({ children }) => {
  return <Provider store={store}>{children}</Provider>;
};

export default StoreProvider;
