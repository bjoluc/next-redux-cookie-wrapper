import Link from "next/link";
import React from "react";
import {useSelector} from "react-redux";

import {pageSlice, selectPage, useAppDispatch} from "./store";

export const DemoComponent: React.FC = () => {
	const dispatch = useAppDispatch();
	const {title, subtitle, counter} = useSelector(selectPage);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				alignItems: "center",
				textAlign: "center",
				minHeight: "95vh",
			}}
		>
			<h3 style={{marginBottom: 0}}>{title}</h3>
			<p style={{color: "gray"}}>{subtitle}</p>
			<p>{`Counter: ${counter}`}</p>
			<button type="button" onClick={() => dispatch(pageSlice.actions.increaseCounter())}>
				Increase Counter
			</button>
			<div style={{display: "grid", gap: "1em", gridAutoFlow: "column", marginTop: "2.5rem"}}>
				<Link href="/ssr/1">SSR Page 1</Link>
				<Link href="/ssr/2">SSR Page 2</Link>
				<Link href="/ssr/3">SSR Page 3</Link>
				<Link href="/static/1">Static Page 1</Link>
				<Link href="/static/2">Static Page 2</Link>
			</div>
		</div>
	);
};
