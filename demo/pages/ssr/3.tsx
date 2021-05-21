import {NextPage} from "next";
import React from "react";

import {DemoComponent} from "../../demo-component";
import {setTitleWithDelay, wrapper} from "../../store";

const Page: NextPage = (props) => <DemoComponent />;

Page.getInitialProps = wrapper.getInitialPageProps((store) => async () => {
	await store.dispatch(setTitleWithDelay(`SSR Page 3`, "via getInitialProps()"));
	return {};
});

export default Page;
