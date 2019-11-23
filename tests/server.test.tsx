/**
 * @jest-environment node
 **/

import { withReduxCookiePersist } from "..";
import httpMocks from "node-mocks-http";
import { NodeCookiesWrapper } from "redux-persist-cookie-storage";
import {
  makeStore,
  StoreApp,
  verifyComponent,
  PlainApp,
  StubbedNextAppContext,
  FlushStateStorePage,
} from "./util";

let appCtx: StubbedNextAppContext;

let setCookie: jest.Mock;

beforeEach(() => {
  NodeCookiesWrapper.prototype.get = jest.fn();

  setCookie = jest.fn();
  NodeCookiesWrapper.prototype.set = setCookie;

  const req = httpMocks.createRequest({ url: "/" });
  const res = httpMocks.createResponse({ req });

  appCtx = {
    ctx: {
      pathname: "/",
      req,
      res,
      query: {},
      AppTree: () => null,
    },
  };
});

describe("withReduxCookiePersist", () => {
  it("should integrate the store using next-redux-wrapper", async () => {
    let WrappedApp = withReduxCookiePersist(makeStore)(PlainApp);
    await verifyComponent(WrappedApp, appCtx, "init");

    WrappedApp = withReduxCookiePersist(makeStore)(StoreApp);
    await verifyComponent(WrappedApp, appCtx, "foo");
  });

  describe("without state cookies", () => {
    it("should pass initialState = undefined to makeStore() at its first call", async () => {
      const makeStoreSpy = jest.fn(makeStore);
      const WrappedApp = withReduxCookiePersist(makeStoreSpy)(PlainApp);

      await verifyComponent(WrappedApp, appCtx, "init");

      expect(makeStoreSpy).toHaveBeenCalledTimes(2);
      expect(makeStoreSpy.mock.calls[0][0]).toBeUndefined();
    });
  });

  describe("with state cookies provided", () => {
    beforeEach(() => {
      const cookies: { [key: string]: string } = {
        "persist:root": JSON.stringify({
          reduxStatus: JSON.stringify("fromCookie"),
          _persist: JSON.stringify({ version: -1, rehydrated: true }),
        }),
        reduxPersistIndex: '["persist:root"]',
      };
      NodeCookiesWrapper.prototype.get = jest.fn(key => cookies[key]);
    });

    it("should use the cookies' state and pass it to makeStore() at its first call", async () => {
      const makeStoreSpy = jest.fn(makeStore);
      const WrappedApp = withReduxCookiePersist(makeStoreSpy)(PlainApp);

      await verifyComponent(WrappedApp, appCtx, "fromCookie");

      expect(makeStoreSpy).toHaveBeenCalledTimes(2);
      expect(makeStoreSpy.mock.calls[0][0]).toEqual({ reduxStatus: "fromCookie" });
    });
  });

  describe("with malformed state cookies provided", () => {
    beforeEach(() => {
      const cookies: { [key: string]: string } = {
        "persist:root": JSON.stringify({
          reduxStatus: "foobarbaz",
        }),
        reduxPersistIndex: '["persist:root"]',
      };
      NodeCookiesWrapper.prototype.get = jest.fn(key => cookies[key]);
    });

    it("should use the default state (pass undefined to makeStore)", async () => {
      const makeStoreSpy = jest.fn(makeStore);
      const WrappedApp = withReduxCookiePersist(makeStoreSpy)(PlainApp);

      await verifyComponent(WrappedApp, appCtx, "init");

      expect(makeStoreSpy).toHaveBeenCalledTimes(2);
      expect(makeStoreSpy.mock.calls[0][0]).toBeUndefined();
    });
  });

  describe("flushReduxStateToCookies() called within getInitialProps()", () => {
    describe.each([true, false])("state cookies: %p", withStateCookies => {
      it("should set cookies using NodeCookieWrapper", async () => {
        if (withStateCookies) {
          const cookies: { [key: string]: string } = {
            "persist:root": JSON.stringify({
              reduxStatus: JSON.stringify("fromCookie"),
              _persist: JSON.stringify({ version: -1, rehydrated: true }),
            }),
            reduxPersistIndex: '["persist:root"]',
          };
          NodeCookiesWrapper.prototype.get = jest.fn(key => cookies[key]);
        }

        const WrappedApp = withReduxCookiePersist(makeStore)(FlushStateStorePage);
        await WrappedApp.getInitialProps(appCtx);

        if (!withStateCookies) {
          // The reduxPersistIndex is not set again if it exists (which is when withStateCookies is true)
          expect(setCookie).toHaveBeenCalledWith("reduxPersistIndex", '["persist:root"]', {
            httpOnly: false,
          });
        }
        expect(setCookie).toHaveBeenCalledWith(
          "persist:root",
          JSON.stringify({
            reduxStatus: JSON.stringify("foo"),
          }),
          { httpOnly: false }
        );
      });
    });
  });
});
