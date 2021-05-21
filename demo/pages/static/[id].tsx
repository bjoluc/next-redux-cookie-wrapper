import {GetStaticPaths, InferGetStaticPropsType, NextPage} from "next";
import React from "react";

import {DemoComponent} from "../../demo-component";
import {setTitleWithDelay, wrapper} from "../../store";

const Page: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = (props) => <DemoComponent />;

export const getStaticPaths: GetStaticPaths = async () => ({
	paths: ["/static/1", "/static/2"],
	fallback: false,
});

export const getStaticProps = wrapper.getStaticProps((store) => async ({params}) => {
	const id = params!.id as string;

	await store.dispatch(setTitleWithDelay(`Static Page ${id}`, "via getStaticProps()"));

	return {props: {id}};
});

export default Page;
