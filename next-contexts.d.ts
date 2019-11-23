// Augment next.js contexts
import "next";
import { Store } from "redux";
import { AppContext as NextAppContext } from "next/app";
import { FlushReduxStateToCookies } from ".";
import { NextJSContext } from "next-redux-wrapper";

declare module "next/app" {
  declare type AppContext = NextAppContext & {
    flushReduxStateToCookies: FlushReduxStateToCookies;
    ctx: NextJSContext;
  };
}
