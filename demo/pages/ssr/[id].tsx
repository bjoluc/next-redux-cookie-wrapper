import {InferGetServerSidePropsType, NextPage} from "next";
import React from "react";

import {DemoComponent} from "../../demo-component";
import {setTitleWithDelay, wrapper} from "../../store";

const Page: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = (props) => (
	<DemoComponent />
);

export const getServerSideProps = wrapper.getServerSideProps((store) => async ({params}) => {
	const id = params!.id as string;

	await store.dispatch(setTitleWithDelay(`SSR Page ${id}`, "via getServerSideProps()"));

	return {props: {id}};
});

export default Page;
