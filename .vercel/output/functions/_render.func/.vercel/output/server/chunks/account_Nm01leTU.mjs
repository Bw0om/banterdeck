import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { d as renderTemplate, i as renderComponent } from "./server_Bjx7FWTN.mjs";
import { t as createComponent } from "./compiler_Bf6GLUpQ.mjs";
import { t as $$Account$1 } from "./Account_Y3SY3ceR.mjs";
//#region src/pages/no/account.astro
var account_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Account,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Account = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "Account", $$Account$1, { "lang": "no" })}`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/src/pages/no/account.astro", void 0);
var $$file = "C:/Users/jonas/Documents/GitHub/banterdeck/src/pages/no/account.astro";
var $$url = "/no/account";
//#endregion
//#region \0virtual:astro:page:src/pages/no/account@_@astro
var page = () => account_exports;
//#endregion
export { page };
