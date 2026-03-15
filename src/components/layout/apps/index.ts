export type AppPage = {
  title: string;
  pagePath: string;
  icon: string;
  roles: string[];
  hidden: boolean;
};

export type AppPageGroup = {
  title: string;
  groupPath: string;
  icon: string;
  isExpanded: boolean;
  pages: AppPage[];
};

export type AppModule = {
  title: string;
  modulePath: string;
  pageGroups: AppPageGroup[];
};

export type AppConfig = {
  key: string;
  name: string;
  abbr: string;
  color: string;
  basePath: string;
  modules: AppModule[];
};
