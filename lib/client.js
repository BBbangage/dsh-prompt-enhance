window.__ModuleLoader__.load({
	id: "dsh-prompt-enhance",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		react = __toESM(react, 1);
		//#region workbuddy-prompt-enhancer client half
		const CSS = ".wben-enhance{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;border:none;background:transparent;border-radius:6px;cursor:pointer;color:inherit;opacity:.85;flex:none}.wben-enhance:hover:not(:disabled){background:rgba(128,128,128,.18);opacity:1}.wben-enhance:disabled{opacity:.4;cursor:default}.wben-enhance--busy{animation:wben-spin 1s linear infinite}.wben-enhance--error{color:#e5484d;opacity:1}@keyframes wben-spin{to{transform:rotate(360deg)}}.wben-group{display:inline-flex;align-items:center;gap:2px}";
		function injectCss() {
			if (document.getElementById("wben-enhance-css")) return;
			const el = document.createElement("style");
			el.id = "wben-enhance-css";
			el.textContent = CSS;
			document.head.appendChild(el);
		}
		const inject = ["slots", "remote", "remote.commands"];
		async function apply(ctx) {
			const slots = ctx.get("slots");
			if (slots === undefined) return;
			injectCss();
			const remote = ctx.get("remote");
			function EnhanceButton(props) {
				const input = props.input;
				const actions = props.inputActions;
				const sessionId = props.sessionId;
				const busyState = react.useState(false);
				const busy = busyState[0];
				const setBusy = busyState[1];
				const errState = react.useState(false);
				const error = errState[0];
				const setError = errState[1];
				const undoState = react.useState(null);
				const lastOriginal = undoState[0];
				const setLastOriginal = undoState[1];
				const rawDraft = (input && typeof input.draft === "string") ? input.draft : "";
				const draft = rawDraft.trim();
				const canUndo = lastOriginal !== null;
				const onClick = () => {
					if (canUndo) {
						if (!actions || typeof actions.setDraft !== "function") return;
						actions.setDraft(lastOriginal);
						setLastOriginal(null);
						return;
					}
					if (draft === "" || !remote || !remote.commands) return;
					setBusy(true);
					setError(false);
					const line = "/prompt-enhance " + draft;
					remote.commands.execute(sessionId, line).then((result) => {
						if (result && result.ok && result.value && result.value.result && typeof result.value.result.text === "string" && actions && typeof actions.setDraft === "function") {
							setLastOriginal(rawDraft);
							actions.setDraft(result.value.result.text);
						} else {
							setError(true);
						}
						setBusy(false);
					}).catch((err) => {
						console.error(err);
						setError(true);
						setBusy(false);
					});
				};
				const cls = "wben-enhance" + (busy ? " wben-enhance--busy" : "") + (error ? " wben-enhance--error" : "");
				const iconPath = canUndo ? "M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" : "M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z";
				return react.createElement("button", {
					className: cls,
					onClick: onClick,
					disabled: busy || (!canUndo && draft === ""),
					title: error ? "增强失败,请重试" : (canUndo ? "撤回:恢复增强前的输入" : "增强提示词:把输入扩写为具体可执行的要求"),
					"aria-label": canUndo ? "撤回增强" : "增强提示词"
				}, react.createElement("svg", {
					width: 15,
					height: 15,
					viewBox: "0 0 24 24",
					fill: "currentColor",
					"aria-hidden": true
				}, react.createElement("path", { d: iconPath })));
			}
			slots.inject("conversation.input.right", () => slots.register({
				name: "conversation.input.right",
				id: "wben-enhance",
				order: 10
			}, EnhanceButton));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
