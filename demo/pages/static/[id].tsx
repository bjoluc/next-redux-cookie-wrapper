import {GetStaticPaths, InferGetStaticPropsType, NextPage} from "next";
import React from "react";

import {DemoComponent} from "../../demo-component";
import {pageSlice, setTitleWithDelay, wrapper} from "../../store";

const Page: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = (props) => <DemoComponent />;

export const getStaticPaths: GetStaticPaths = async () => ({
	paths: [
		{params: {id: "1"}, locale: "en"},
		{params: {id: "2"}, locale: "en"},
		{params: {id: "1"}, locale: "fr"},
		{params: {id: "2"}, locale: "fr"},
		{params: {id: "1"}, locale: "nl"},
		{params: {id: "2"}, locale: "nl"},
	],
	fallback: false,
});

export const getStaticProps = wrapper.getStaticProps((store) => async ({params, locale}) => {
	const id = params!.id as string;

	store.dispatch(pageSlice.actions.setLocale(locale!));
	await store.dispatch(setTitleWithDelay(`Static Page ${id}`, "via getStaticProps()"));

	return {props: {id}};
});

export default Page;
