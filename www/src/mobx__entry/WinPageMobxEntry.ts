import { Toggle, ToggleUiState } from "../stores/AppStateService";
import { TreeNode } from "../stores/WhatIsNewTocTreeStore";
import { IWinPageContentData, IWhatIsNewToc } from "../types/IWhatIsNewToc";
import { VersionFilterStore } from "../stores/VersionFilterStore";
import { createIntersectionObserverStore } from "../stores/IntersectionObserverStore";
import { ContentSectionStore } from "../stores/ContentSectionStore";
import { VisibleSectionValidator } from "../validators/VisibleSectionValidator";
import { PageNavWithFilterStore } from "../stores/PageNavWithFilterStore";
import { createBehaviorNotification } from "../stores/behavior-notificaion-store";
import { IWinPageNavData } from "../page-templates/what-is-new-page/WhatIsNewPageProvider";
import { ContentNavStore } from "../stores/ContentNavStore";
import { ContentSectionWithFilterStore } from "../stores/ContentSectionWithFilterStore";
import { LocationPartial, RouterStore } from "../stores/RouterStore";
import { createContext, useContext } from "react";
import { CollapseTreeMobxStore } from "../stores/CollapseTreeMobxStore";
import { InnovationDataStore } from "../stores/InnovationDataStore";
import { FormInnovationFilter } from "../filters/FormInnovationFilter";
import { ContentDataWinPageStore } from "../stores/ContentDataWinPageStore";
import { computed, observe } from "mobx";
import { InnovationVersionFilterDataStore } from "../stores/InnovationVersionFilterDataStore";
import { DriverNavMobx } from "../stores/DriverNavMobx";
import { WinAppDriverNavMobx } from "../stores/WinAppDriverNavMobx";
import { isServer, isBrowser } from "../utils/app-utils";



interface IWhatIsNewPageStoresParams {
  winTocTree:TreeNode<IWhatIsNewToc>[];
  innovationData:IWinPageContentData;
  pageNavDataAll:IWinPageNavData[];
  location:LocationPartial;
  // initialCheckedVersion:string[];
  // versionInfoAll:VersionInfoMeta[];
}

export class WinPageMobxEntry {
  private static instance: ReturnType<typeof WinPageMobxEntry.create> | null;

  static destroy = () => WinPageMobxEntry.instance = null;
  static create = ({ innovationData,winTocTree,pageNavDataAll,location}: IWhatIsNewPageStoresParams) => {

    let router = new RouterStore( location );
    let contentIntersectionObserver = createIntersectionObserverStore( {
      containerSelector:`main.content`,
      sectionSelector:`section.content__section`,
    } );

    let contentDataWinPageStore = ContentDataWinPageStore.create({
      pageContent: innovationData
    });



    let innovationVersionFilterDataStore = InnovationVersionFilterDataStore.create({
      contentDataWinPageStore
    })

    let versionFilter = new VersionFilterStore({});
    versionFilter.addVersionInfo( innovationVersionFilterDataStore.versionFilterDataAll );
    versionFilter.checkedAllVersion();


    let visibleSectionValidator = VisibleSectionValidator.create( {
      contentDataWinPageStore,
      versionFilter
    } );

    let contentSectionDefault = ContentSectionStore.create( {
      router,
      contentIntersectionObserver,
    } );
    let contentSection = ContentSectionWithFilterStore.create( {
      contentSection:contentSectionDefault,
      router,
      contentIntersectionObserver,
      versionFilter,
      visibleSectionValidator,
    } );

    let innovations = new InnovationDataStore(contentDataWinPageStore);
    innovations.addFilter(new FormInnovationFilter(versionFilter));

    computed(() => router.pageName).observe(() => {
      innovations.deleteAllFilter();
      innovations.addFilter(new FormInnovationFilter(versionFilter));
    });


    let pageNav = PageNavWithFilterStore.create( {
      pageNavDataAll,
      innovationStore: innovations,
      router,
      versionFilter,
      contentSection
    } );
    let contentNav = ContentNavStore.create( {
      pageNav,
      router,
      contentSection,
    } );

    let winTocCollapseStore = new CollapseTreeMobxStore(winTocTree, false);
    let driverNav = new DriverNavMobx(router, winTocCollapseStore);

    let appDriverNav = new WinAppDriverNavMobx(
      driverNav,
      router,
      versionFilter,
      contentSection
    );

    return{
      stores:{
        winTocCollapseStore,
        contentDownPanelStore:new Toggle(ToggleUiState.Close),
        behaviorNotificationStore:createBehaviorNotification(),
        innovationVersionFilterDataStore,
        versionFilter,
        innovations,
        contentDataWinPageStore,
        router,
        contentIntersectionObserver,
        contentNav,
        appDriverNav,
        contentSection,
      },
      validators:{
        visibleSectionValidator,
      }
    }
  }
  static getInstance(params: IWhatIsNewPageStoresParams){
    if (!WinPageMobxEntry.instance) {
      WinPageMobxEntry.instance = WinPageMobxEntry.create(params);
    }

    return WinPageMobxEntry.instance;
  }
}


export type UseWhatIsNewPageMobxEntry=ReturnType<typeof WinPageMobxEntry.getInstance>;
export type UseWhatIsNewPageStores=ReturnType<typeof WinPageMobxEntry.getInstance>["stores"];


export const MobxWhatIsNewPageContext = createContext<UseWhatIsNewPageStores | null>( null );
export const useWhatIsNewPageStores = () => useContext( MobxWhatIsNewPageContext )  as UseWhatIsNewPageStores;

export const useVersionFilter = ():UseWhatIsNewPageStores["versionFilter"] => {
  let { versionFilter } = useWhatIsNewPageStores();

  return versionFilter;
};
export const useInnovations = ():UseWhatIsNewPageStores["innovations"] => {
  let { innovations } = useWhatIsNewPageStores();

  return innovations;
};
export const useInnovationVersionFilterData = ():UseWhatIsNewPageStores["innovationVersionFilterDataStore"] => {
  let { innovationVersionFilterDataStore } = useWhatIsNewPageStores();

  return innovationVersionFilterDataStore;
};
// export const useDriverNav = ():UseWhatIsNewPageStores["driverNav"] => {
//   let { driverNav } = useWhatIsNewPageStores();
//
//   return driverNav;
// };
export const useAppDriverNav = ():UseWhatIsNewPageStores["appDriverNav"] => {
  let { appDriverNav } = useWhatIsNewPageStores();

  return appDriverNav;
};
