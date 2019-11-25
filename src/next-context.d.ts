// Augment next.js AppContext
import { FlushReduxStateToCookies } from ".";
import { NextJSContext } from "next-redux-wrapper";

declare module "next/app" {
  type AppContext = {
    flushReduxStateToCookies: FlushReduxStateToCookies;
    ctx: NextJSContext;
  };
}
