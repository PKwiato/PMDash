<template>
  <div class="p-lg max-w-[1400px] mx-auto">
    <header class="flex justify-between items-end mb-xl">
      <div>
        <h1 class="font-headline-xl text-headline-xl text-slate-900">Private Notes</h1>
        <p class="font-body-md text-body-md text-slate-500 mt-xs">Personal thoughts and draft documentation for your current projects.</p>
      </div>
      <div class="flex gap-sm">
        <button class="px-md py-2 border border-outline-variant text-slate-600 rounded flex items-center gap-2 hover:bg-slate-50 transition-colors">
          <span class="material-symbols-outlined text-[18px]">filter_list</span>
          <span class="font-label-md text-label-md">Filter</span>
        </button>
        <button class="px-md py-2 bg-secondary text-white rounded flex items-center gap-2 hover:bg-opacity-90 transition-colors">
          <span class="material-symbols-outlined text-[18px]">add</span>
          <span class="font-label-md text-label-md">Create Note</span>
        </button>
      </div>
    </header>
    <!-- Bento Grid Layout for Notes -->
    <div class="grid grid-cols-12 gap-gutter">
      <!-- Featured Card (Large) -->
      <div class="col-span-12 lg:col-span-8 group bg-white border border-slate-200 rounded-xl p-lg flex flex-col note-card transition-all duration-200 hover:bg-slate-50">
        <div class="flex justify-between items-start mb-md">
          <div class="flex items-center gap-sm">
            <span class="font-label-md text-label-md text-secondary bg-secondary-container px-2 py-0.5 rounded">JM-452</span>
            <span class="text-slate-300 font-light">|</span>
            <span class="font-label-sm text-label-sm text-slate-400 uppercase tracking-tighter">Documentation Draft</span>
          </div>
          <span class="material-symbols-outlined text-slate-300 group-hover:text-slate-600 cursor-pointer">more_vert</span>
        </div>
        <h3 class="font-headline-lg text-headline-lg text-slate-900 mb-sm">Architecture Review: Microservices Transition Phase 2</h3>
        <p class="font-body-md text-body-md text-slate-600 flex-1 line-clamp-3">
          Initial thoughts on migrating the legacy billing module. We need to ensure zero downtime during the database cutover. The primary concern remains the eventual consistency issues between the user profile service and the transaction log. Consider implementing a temporary dual-write mechanism...
        </p>
        <div class="mt-lg pt-md border-t border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-sm text-slate-400 font-body-sm text-body-sm">
            <span class="material-symbols-outlined text-[16px]">schedule</span>
            <span>Last modified 2 hours ago</span>
          </div>
          <div class="flex -space-x-2">
            <div class="w-6 h-6 rounded-full border-2 border-white bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-700">MT</div>
          </div>
        </div>
      </div>
      <!-- Side Card (Vertical) -->
      <div class="col-span-12 md:col-span-6 lg:col-span-4 group bg-white border border-slate-200 rounded-xl p-lg flex flex-col note-card transition-all duration-200 hover:bg-slate-50">
        <div class="flex justify-between items-start mb-md">
          <span class="font-label-md text-label-md text-on-secondary-container bg-surface-container-high px-2 py-0.5 rounded">Personal</span>
          <span class="material-symbols-outlined text-slate-300 group-hover:text-slate-600 cursor-pointer">push_pin</span>
        </div>
        <h3 class="font-headline-md text-headline-md text-slate-900 mb-sm">One-on-One Prep: Alex Q4</h3>
        <p class="font-body-sm text-body-sm text-slate-500 mb-md line-clamp-4">
          - Discuss career growth towards Lead Engineer.<br/>
          - Review PR velocity improvements.<br/>
          - Clarify expectations on architectural ownership.<br/>
          - Address feedback regarding cross-team communication.
        </p>
        <div class="mt-auto pt-md border-t border-slate-100 flex items-center gap-sm text-slate-400 font-body-sm text-body-sm">
          <span class="material-symbols-outlined text-[16px]">calendar_today</span>
          <span>Modified Oct 12, 2023</span>
        </div>
      </div>
      <!-- Standard Note Cards -->
      <div class="col-span-12 md:col-span-6 lg:col-span-4 group bg-white border border-slate-200 rounded-xl p-lg flex flex-col note-card transition-all duration-200 hover:bg-slate-50">
        <div class="mb-md">
          <span class="font-label-md text-label-md text-secondary bg-secondary-container px-2 py-0.5 rounded">JM-102</span>
        </div>
        <h3 class="font-headline-md text-headline-md text-slate-900 mb-sm">Bug Analysis: Cache Invalidation</h3>
        <p class="font-body-sm text-body-sm text-slate-500 line-clamp-2">
          Found intermittent issue with Redis keys not expiring on user logout. Likely race condition in auth service.
        </p>
        <div class="mt-md pt-md border-t border-slate-100 flex items-center gap-sm text-slate-400 font-body-sm text-body-sm">
          <span class="material-symbols-outlined text-[16px]">schedule</span>
          <span>Yesterday</span>
        </div>
      </div>
      <div class="col-span-12 md:col-span-6 lg:col-span-4 group bg-white border border-slate-200 rounded-xl p-lg flex flex-col note-card transition-all duration-200 hover:bg-slate-50">
        <div class="mb-md">
          <span class="font-label-md text-label-md text-secondary bg-secondary-container px-2 py-0.5 rounded">JM-219</span>
        </div>
        <h3 class="font-headline-md text-headline-md text-slate-900 mb-sm">Meeting Notes: API V2 Specs</h3>
        <p class="font-body-sm text-body-sm text-slate-500 line-clamp-2">
          Team agreed to use GraphQL for the new mobile endpoints. Research Apollo Server setup.
        </p>
        <div class="mt-md pt-md border-t border-slate-100 flex items-center gap-sm text-slate-400 font-body-sm text-body-sm">
          <span class="material-symbols-outlined text-[16px]">schedule</span>
          <span>3 days ago</span>
        </div>
      </div>
      <div class="col-span-12 md:col-span-6 lg:col-span-4 group bg-white border border-slate-200 rounded-xl p-lg flex flex-col note-card transition-all duration-200 hover:bg-slate-50">
        <div class="mb-md flex gap-sm">
          <span class="font-label-md text-label-md text-secondary bg-secondary-container px-2 py-0.5 rounded">JM-881</span>
          <span class="font-label-md text-label-md text-error bg-error-container px-2 py-0.5 rounded">Urgent</span>
        </div>
        <h3 class="font-headline-md text-headline-md text-slate-900 mb-sm">Deployment Checklist</h3>
        <p class="font-body-sm text-body-sm text-slate-500 line-clamp-2">
          1. Run migration scripts.<br/>
          2. Check Sentry for error spikes.<br/>
          3. Notify CS team.
        </p>
        <div class="mt-md pt-md border-t border-slate-100 flex items-center gap-sm text-slate-400 font-body-sm text-body-sm">
          <span class="material-symbols-outlined text-[16px]">schedule</span>
          <span>1 week ago</span>
        </div>
      </div>
      <!-- Asymmetric Accent Card -->
      <div class="col-span-12 lg:col-span-4 bg-primary-container text-on-primary-container rounded-xl p-lg flex flex-col relative overflow-hidden group">
        <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <span class="material-symbols-outlined text-[120px]">lightbulb</span>
        </div>
        <h3 class="font-headline-md text-headline-md text-white mb-md">Quick Idea?</h3>
        <p class="font-body-sm text-body-sm text-primary-fixed-dim mb-lg">
          Don't let inspiration slip away. Jot down a quick scratchpad note that isn't tied to a task yet.
        </p>
        <button class="mt-auto w-fit px-4 py-2 bg-secondary-container text-on-secondary-container rounded font-label-md text-label-md hover:bg-secondary-fixed transition-colors">
          Start Scratchpad
        </button>
      </div>
      <!-- Large Table-style note entry -->
      <div class="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div class="p-md border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 class="font-label-md text-label-md text-slate-500 uppercase tracking-wider">Recently Referenced Tasks</h3>
          <button class="text-teal-600 font-label-sm text-label-sm hover:underline">View All Tasks</button>
        </div>
        <div class="divide-y divide-slate-100">
          <div class="p-md flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div class="flex items-center gap-md">
              <span class="font-label-md text-label-md text-secondary w-16">JM-901</span>
              <div>
                <p class="font-body-md text-body-md text-slate-900">Refactor Auth Middleware</p>
                <p class="text-[11px] text-slate-400">Linked note: "Security Audit Findings"</p>
              </div>
            </div>
            <span class="text-body-sm text-slate-400">Oct 24, 2023</span>
          </div>
          <div class="p-md flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div class="flex items-center gap-md">
              <span class="font-label-md text-label-md text-secondary w-16">JM-772</span>
              <div>
                <p class="font-body-md text-body-md text-slate-900">Update Dashboard UI</p>
                <p class="text-[11px] text-slate-400">Linked note: "Design Feedback - Marketing"</p>
              </div>
            </div>
            <span class="text-body-sm text-slate-400">Oct 22, 2023</span>
          </div>
          <div class="p-md flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div class="flex items-center gap-md">
              <span class="font-label-md text-label-md text-secondary w-16">JM-104</span>
              <div>
                <p class="font-body-md text-body-md text-slate-900">Fix Footer Links</p>
                <p class="text-[11px] text-slate-400">No note attached</p>
              </div>
            </div>
            <span class="text-body-sm text-slate-400">Oct 21, 2023</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
