import {InferGetServerSidePropsType, NextPage} from "next";
import React from "react";

import {DemoComponent} from "../../demo-component";
import {pageSlice, setTitleWithDelay, wrapper} from "../../store";

const Page: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = (props) => {
	wrapper.useHydration(props);
	return <DemoComponent />;
};

export const getServerSideProps = wrapper.getServerSideProps(
	(store) =>
		async ({params, locale}) => {
			const id = params!.id as string;

			store.dispatch(pageSlice.actions.setLocale(locale!));
			await store.dispatch(setTitleWithDelay(`SSR Page ${id}`, "via getServerSideProps()"));

			return {props: {id}};
		}
);

export default Page;
