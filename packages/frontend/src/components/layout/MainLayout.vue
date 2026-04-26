<template>
  <div class="bg-background text-on-surface min-h-screen font-sans">
    <!-- TopAppBar -->
    <header class="fixed top-0 w-full z-50 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex justify-between items-center h-14 px-4 font-sans text-sm antialiased">
      <div class="flex items-center gap-8">
        <span class="text-lg font-bold tracking-tight text-slate-900 dark:text-white">JiraMonitor</span>
        <div class="hidden md:flex items-center gap-6">
          <router-link to="/" class="text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200 h-14 flex items-center px-2" active-class="text-teal-600 dark:text-teal-400 font-bold border-b-2 border-teal-600" exact-active-class="text-teal-600 dark:text-teal-400 font-bold border-b-2 border-teal-600">Dashboard</router-link>
          <router-link to="/tasks" class="text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200 h-14 flex items-center px-2" active-class="text-teal-600 dark:text-teal-400 font-bold border-b-2 border-teal-600">Tasks</router-link>
          <router-link to="/kanban" class="text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200 h-14 flex items-center px-2" active-class="text-teal-600 dark:text-teal-400 font-bold border-b-2 border-teal-600">Kanban</router-link>
          <router-link to="/notes" class="text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200 h-14 flex items-center px-2" active-class="text-teal-600 dark:text-teal-400 font-bold border-b-2 border-teal-600">Private Notes</router-link>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="relative group">
          <span class="material-symbols-outlined text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">search</span>
          <input type="text" placeholder="Search tasks..." class="bg-slate-100 border-none rounded-lg pl-10 pr-4 py-1.5 text-sm focus:ring-2 focus:ring-secondary transition-all w-64" />
        </div>
        <button class="material-symbols-outlined text-slate-500 hover:bg-slate-50 p-2 rounded-full transition-colors">notifications</button>
        <button class="material-symbols-outlined text-slate-500 hover:bg-slate-50 p-2 rounded-full transition-colors">help</button>
        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUo91502LN6AfQcT9b5oRcDzTc5p_KeN9C0vnYK_7YsyrhKba_DkSmhavqyrFEopIpdW2ImXdsshnW77siZqtLNDJtcwdIEQMl3VD2JAWcR_sItsroujYmeaJ6b_sIewl8tVl9IXhZ7ATmfOPXs4UT0y35Rmt04EhpwZNLECKNWbXFuuHJ5LDP9yTvgtsRX67wjCSV4_r6epFbiIdNGbqpfMrvy468XuiOxNxe5PLhhjILYcvrOiX5naHXOVOdv9kbhM6DhGkrJug" alt="User profile avatar" class="w-8 h-8 rounded-full border border-slate-200" />
      </div>
    </header>

    <!-- SideNavBar -->
    <aside class="fixed left-0 top-0 h-full w-60 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col py-6 gap-2 pt-20 z-40 hidden md:flex font-sans text-sm font-medium">
      <div class="px-6 mb-8">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-teal-600 rounded flex items-center justify-center text-white font-black">P</div>
          <div>
            <div class="text-slate-900 font-bold">Project Workspace</div>
            <div class="text-slate-500 text-[10px] uppercase tracking-wider">Jira Integration</div>
          </div>
        </div>
      </div>
      <nav class="flex-1 space-y-1 px-3">
        <router-link to="/" class="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100 transition-all rounded-lg" active-class="text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 border-r-4 border-teal-600" exact-active-class="text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 border-r-4 border-teal-600">
          <span class="material-symbols-outlined">dashboard</span>
          Dashboard
        </router-link>
        <router-link to="/tasks" class="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100 transition-all rounded-lg" active-class="text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 border-r-4 border-teal-600">
          <span class="material-symbols-outlined">format_list_bulleted</span>
          Task List
        </router-link>
        <router-link to="/kanban" class="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100 transition-all rounded-lg" active-class="text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 border-r-4 border-teal-600">
          <span class="material-symbols-outlined">view_kanban</span>
          Kanban
        </router-link>
        <router-link to="/notes" class="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100 transition-all rounded-lg" active-class="text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 border-r-4 border-teal-600">
          <span class="material-symbols-outlined">edit_note</span>
          Private Notes
        </router-link>
      </nav>
      <div class="px-3 mt-4">
        <button class="w-full bg-teal-600 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm">
          <span class="material-symbols-outlined text-sm">add</span>
          New Task
        </button>
      </div>
      <div class="mt-auto space-y-1 px-3 border-t border-slate-200 pt-4">
        <router-link to="/settings" class="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all rounded-lg" active-class="text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 border-r-4 border-teal-600">
          <span class="material-symbols-outlined">settings</span>
          Settings
        </router-link>
        <a href="#" class="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all rounded-lg">
          <span class="material-symbols-outlined">logout</span>
          Logout
        </a>
      </div>
    </aside>

    <!-- Main Content Canvas -->
    <main class="md:pl-60 pt-14 min-h-screen">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>
