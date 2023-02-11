import type {AppProps} from "next/app";
import * as React from "react";
import {Provider} from "react-redux";

import {wrapper} from "../store";

const App = ({Component, pageProps}: AppProps) => {
	const store = wrapper.useStore();

	return (
		<Provider store={store}>
			<Component {...pageProps} />
		</Provider>
	);
};

export default App;
