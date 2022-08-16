import {NextPage} from "next";
import React from "react";

import {DemoComponent} from "../../demo-component";
import {pageSlice, setTitleWithDelay, wrapper} from "../../store";

const Page: NextPage = (props) => <DemoComponent />;

Page.getInitialProps = wrapper.getInitialPageProps((store) => async ({locale}) => {
	store.dispatch(pageSlice.actions.setLocale(locale!));
	await store.dispatch(setTitleWithDelay(`SSR Page 3`, "via getInitialProps()"));
	return {};
});

export default Page;
