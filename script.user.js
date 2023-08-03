// ==UserScript==
// @name         自动切换开发环境
// @namespace    http://tampermonkey.net/
// @version      0.1
// @license MIT
// @description  自动切本地开发环境，配置页面信息后，如果页面host匹配上，就会自动跳转本地开发环境下并自动同步页面Storage的值到开发环境
// @author       liliangrong
// @include      *
// @require      https://cdn.bootcdn.net/ajax/libs/vue/2.7.0/vue.js
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant GM_notification
// ==/UserScript==

(function () {
  "use strict";
  // 导入外部 CSS 链接
  GM_addStyle(
    `@import 'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.16/tailwind.min.css';`
  );

  var syncConfig = GM_getValue("syncConfig", [
    {
      sourceHost: "http://return-admin-test.parcelpanel.com/",
      targetHost: "http://localhost:8555/",
      checked: true,
    },
    {
      sourceHost: "https://hostC.example.com/",
      targetHost: "https://hostD.example.com/",
      checked: true,
    },
    // 可以根据需求添加更多 host 之间的数据同步关系
  ]);

  // 在网页上创建一个 DOM 元素
  function createAppContainer() {
    const appContainer = document.createElement("div");
    appContainer.id = "sync-app";
    document.body.appendChild(appContainer);
    return appContainer;
  }

  function syncExecute() {
    var currentPageURL = window.location.origin;
    var syncInfo = syncConfig.find(
      (item) =>
        item.checked &&
        (item.sourceHost === currentPageURL ||
          item.targetHost === currentPageURL)
    );
    if (syncInfo) {
      // 如果当前页面是源页面，则执行数据收集和传递操作

      if (syncInfo.sourceHost === currentPageURL) {
        // 在当前页面加载完成后执行

        window.addEventListener("load", function () {
          // 收集 localStorage 和 sessionStorage 数据

          var storageData = {
            localStorageData: JSON.stringify(localStorage),

            sessionStorageData: JSON.stringify(sessionStorage),
          };
          // 将数据保存到 GM_setValue 中，用于在目标页面获取
          GM_setValue("syncData", storageData);
          // 跳转到目标页面
          window.location.href = syncInfo.targetHost;
        });
      }
      // 如果当前页面是目标页面，则执行数据接收和同步操作
      else if (syncInfo.targetHost === currentPageURL) {
        // 在当前页面加载完成后执行

        window.addEventListener("load", function () {
          // 获取从源页面传递过来的数据

          var storageData = GM_getValue("syncData");

          if (storageData) {
            // 同步 localStorage 和 sessionStorage 数据到当前页面

            if (storageData.localStorageData) {
              var localStorageData = JSON.parse(storageData.localStorageData);

              for (var key in localStorageData) {
                localStorage.setItem(key, localStorageData[key]);
              }
            }

            if (storageData.sessionStorageData) {
              var sessionStorageData = JSON.parse(
                storageData.sessionStorageData
              );

              for (var key in sessionStorageData) {
                sessionStorage.setItem(key, sessionStorageData[key]);
              }
            }
          }
        });
      }
    }
  }

  createAppContainer();
  syncExecute();
  // Vue 2 + Tailwind App
  new Vue({
    el: "#sync-app",
    methods: {
      handleDelete(i) {
        if (this.value.length > 1) {
          this.value.splice(i, 1);
        } else {
          alert("最后一项不能删除");
        }
      },
      handleAdd() {
        this.value.push({
          sourceHost: "",
          targetHost: "",
          checked: true,
        });
      },
      submit() {
        GM_setValue(
          "syncConfig",
          this.value.filter((item) => item.sourceHost || item.targetHost)
        );
        this.show = false;
        alert("保存配置成功");
      },
    },

    data() {
      return {
        show: false,
        value: syncConfig,
      };
    },

    template: `
<div class="fixed top-20 right-5 group z-50">
  <div class="flex justify-end">
    <div
      id="dot"
      :class="[
            'transition-all cursor-pointer w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center opacity-50',
            {'bg-blue-600 opacity-80':show}
            ]"
      @click="show = !show"
    >
      <div class="w-2 h-2 rounded-full bg-white"></div>
    </div>
  </div>
  <div v-if="show" class="text-center  shadow-lg bg-white" style="width: 780px">
    <div class="text-right mt-4 p-4 shadow-sm">
      <button
        type="button"
        @click="handleAdd"
        class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:w-auto"
      >
        Add New
      </button>
      <button
        @click="submit"
        type="button"
        class="ml-2 inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:w-auto"
      >
        Save
      </button>
    </div>
    <div class="shadow-sm overflow-hidden my-8">
      <table class="border-collapse table-auto w-full text-sm">
        <thead>
          <tr>
            <th
              class="border-b dark:border-slate-600 font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left"
            ></th>
            <th
              class="border-b dark:border-slate-600 font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left"
            >
              sourceHost
            </th>
            <th
              class="border-b dark:border-slate-600 font-medium p-4 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left"
            >
              targetHost
            </th>
            <th
              class="text-right border-b dark:border-slate-600 font-medium p-4 pr-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left"
            >
              Operator
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-slate-800">
          <tr v-for="(item,i) in value">
            <td
              class="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400"
            >
              <input v-model="item.checked" type="checkbox" />
            </td>
            <td
              class="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400"
            >
              <input
                v-model="item.sourceHost"
                class="placeholder:italic placeholder:text-slate-400 block bg-white w-full border border-slate-300 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:border-sky-500 focus:ring-sky-500 focus:ring-1 sm:text-sm"
                placeholder="eg:http://return-admin-test.parcelpanel.com/"
                type="text"
              />
            </td>

            <td
              class="border-b border-slate-100 dark:border-slate-700 p-4 text-slate-500 dark:text-slate-400"
            >
              <input
                v-model="item.targetHost"
                class="placeholder:italic placeholder:text-slate-400 block bg-white w-full border border-slate-300 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:border-sky-500 focus:ring-sky-500 focus:ring-1 sm:text-sm"
                placeholder="eg:http://127.0.0.1:8000"
                type="text"
              />
            </td>
            <td
              class="text-right border-b border-slate-100 dark:border-slate-700 p-4 text-slate-500 dark:text-slate-400"
            >
              <button
                @click="handleDelete(i)"
                type="button"
                class="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
            `,
  });
})();
