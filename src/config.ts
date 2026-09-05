import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "土豆自留地",
	subtitle: "随便看看~",
	lang: "zh_CN", // 'en', 'zh_CN', 'zh_TW', 'ja', 'ko', 'es', 'th'
	themeColor: {
		hue: 260, // 设置默认主题色,影响初次访问以及主页调色盘重置按钮
		fixed: false, // 是否禁止用户调整主题颜色
	},
	banner: {
		enable: false,
		//src: "assets/images/demo-banner.png", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
		src: "assets/images/banner.jpg", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
		position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		credit: {
			enable: true, // Display the credit text of the banner image
			text: "不忘初心", // Credit text to be displayed
			url: "https://www.gov.cn/gongbao/2026/issue_12486/202601/content_7054238.html", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: true, // 博文是否在页面右侧显示目录
		depth: 3, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		// Leave this array empty to use the default favicon
		// {
		//   src: '/favicon/icon.png',    // Path of the favicon, relative to the /public directory
		//   theme: 'light',              // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
		//   sizes: '32x32',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
		// }
	],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.About,
		// {
		// 	name: "GitHub",
		// 	url: "https://github.com/syz0610/syz0610.github.io", // 网站外链
		// 	external: true, // 外链图标是否显示
		// }, // 这边注释与否影响导航栏是否显示外链选项卡,这边因为页脚有了所以做了屏蔽处理
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/head.png", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
	name: "土豆",
	bio: "山海寻梦，不觉其远。	前路迢迢，阔步而行。",
	links: [
		{
			name: "Twitter",
			icon: "fa6-brands:twitter", // Visit https://icones.js.org/ for icon codes
			url: "https://twitter.com",
		},
		{
			name: "Steam",
			icon: "fa6-brands:steam",
			url: "https://store.steampowered.com",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/saicaca/fuwari",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: false,
	name: "未经作者书面授权，禁止转载或用于任何商业用途。",
	// url: "",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};
