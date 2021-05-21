import type {AppProps} from "next/app";
import * as React from "react";

import {wrapper} from "../store";

const App = ({Component, pageProps}: AppProps) => {
	return <Component {...pageProps} />;
};

export default wrapper.withRedux(App);
