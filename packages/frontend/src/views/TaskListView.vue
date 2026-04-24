<template>
  <div class="p-lg max-w-[1400px] mx-auto">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
      <div>
        <nav class="flex items-center gap-2 text-label-sm text-on-surface-variant mb-2">
          <span>Projects</span>
          <span class="material-symbols-outlined text-[12px]">chevron_right</span>
          <span>JiraMonitor</span>
          <span class="material-symbols-outlined text-[12px]">chevron_right</span>
          <span class="text-on-surface">Tasks</span>
        </nav>
        <h1 class="font-headline-xl text-on-surface">Task List</h1>
      </div>
      <div class="flex items-center gap-sm">
        <div class="relative">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
          <input type="text" placeholder="Search tasks..." class="pl-10 pr-4 py-2 border border-outline-variant rounded-lg font-body-md w-64 focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all" />
        </div>
        <button class="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-container-low transition-colors">
          <span class="material-symbols-outlined text-[18px]">filter_list</span>
          Filter
        </button>
        <button class="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-container-low transition-colors">
          <span class="material-symbols-outlined text-[18px]">sort</span>
          Sort
        </button>
      </div>
    </header>
    <div class="grid grid-cols-12 gap-gutter mb-lg">
      <div class="col-span-12 lg:col-span-12">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-container-low border-b border-outline-variant">
                  <th class="px-md py-3 font-label-sm text-on-surface-variant uppercase tracking-wider w-24">Task ID</th>
                  <th class="px-md py-3 font-label-sm text-on-surface-variant uppercase tracking-wider">Summary</th>
                  <th class="px-md py-3 font-label-sm text-on-surface-variant uppercase tracking-wider w-32">Status</th>
                  <th class="px-md py-3 font-label-sm text-on-surface-variant uppercase tracking-wider w-28">Priority</th>
                  <th class="px-md py-3 font-label-sm text-on-surface-variant uppercase tracking-wider w-16 text-center">Notes</th>
                  <th class="px-md py-3 font-label-sm text-on-surface-variant uppercase tracking-wider w-32">Assignee</th>
                  <th class="px-md py-3 font-label-sm text-on-surface-variant uppercase tracking-wider w-12"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant">
                <tr class="hover:bg-surface-container transition-colors group">
                  <td class="px-md py-3 font-label-md text-secondary">JM-1024</td>
                  <td class="px-md py-3">
                    <div class="flex flex-col">
                      <span class="font-body-md font-semibold text-on-surface">Implement OAuth2 Authentication Flow</span>
                      <span class="text-label-sm text-on-surface-variant">Auth Service • Updated 2h ago</span>
                    </div>
                  </td>
                  <td class="px-md py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-medium bg-secondary-container text-on-secondary-fixed-variant">
                      In Progress
                    </span>
                  </td>
                  <td class="px-md py-3">
                    <div class="flex items-center gap-2">
                      <span class="w-1.5 h-6 rounded-full bg-error"></span>
                      <span class="font-label-md text-on-surface">High</span>
                    </div>
                  </td>
                  <td class="px-md py-3 text-center">
                    <span class="material-symbols-outlined text-outline text-[18px]" style="font-variation-settings: 'FILL' 1;">edit_note</span>
                  </td>
                  <td class="px-md py-3">
                    <div class="flex items-center gap-2">
                      <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoMC5U9LjWoE9hq0aze4n0fnvzEfOMl5isYdoDoHHK4GWoSCQ_kB5rgdnSaHbeiQpK1k1BpQR-gsBD_QnayJPPHBxg9J0FEFW3d7ADkunonuy1WQNM0Vz5w3pdIzcgocyV9ATze-vzHuh6JPaw8YOc8eHq2i2k3BvrEMt6IYnJhYglbBWtJu1avgccxE8cC3IOv3MT8epeVrHqD-Bt-k0EpkgqBHwmUutQmZAPJUoaYVpXbWCq7dzw9M6aHsYA2j-Xb0Ukeeil6Ac" class="w-6 h-6 rounded-full" alt="S. Miller" />
                      <span class="text-body-sm">S. Miller</span>
                    </div>
                  </td>
                  <td class="px-md py-3">
                    <button class="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-outline hover:text-on-surface">
                      <span class="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>
                <tr class="hover:bg-surface-container transition-colors group">
                  <td class="px-md py-3 font-label-md text-secondary">JM-1025</td>
                  <td class="px-md py-3">
                    <div class="flex flex-col">
                      <span class="font-body-md font-semibold text-on-surface">Refactor Data Persistence Layer</span>
                      <span class="text-label-sm text-on-surface-variant">Backend Core • Updated 5h ago</span>
                    </div>
                  </td>
                  <td class="px-md py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-medium bg-surface-container-high text-on-surface-variant">
                      To Do
                    </span>
                  </td>
                  <td class="px-md py-3">
                    <div class="flex items-center gap-2">
                      <span class="w-1.5 h-6 rounded-full bg-tertiary-container"></span>
                      <span class="font-label-md text-on-surface">Medium</span>
                    </div>
                  </td>
                  <td class="px-md py-3 text-center"></td>
                  <td class="px-md py-3">
                    <div class="flex items-center gap-2">
                      <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlBVapBepAWj-qRLBt8mrNtXEhVBlROdBANIocm5pXnbIjzkFa4UtY2hjib4I5QfB5AVmzlY4WDJ-pE8tcY0Ci2sfL535ZzEj5VlANxwV9VcE6MxQAzNNOSAbUjP9GgcZqAsKhJoJMA05kKUxxFQV6OQxRRaD04sGhz5pMAX20wueCeHVwisqnOOhnkoSMjABQW5V0zEp-1SJlsg17hu-uMyWXrqlf_ILHidMF0Fdxez7Ex_pbsddtrP4S5WI0cVGy0iIsjVb0Yrc" class="w-6 h-6 rounded-full" alt="A. Chen" />
                      <span class="text-body-sm">A. Chen</span>
                    </div>
                  </td>
                  <td class="px-md py-3">
                    <button class="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-outline hover:text-on-surface">
                      <span class="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>
                <tr class="hover:bg-surface-container transition-colors group">
                  <td class="px-md py-3 font-label-md text-secondary">JM-1026</td>
                  <td class="px-md py-3">
                    <div class="flex flex-col">
                      <span class="font-body-md font-semibold text-on-surface">Design System Documentation Sync</span>
                      <span class="text-label-sm text-on-surface-variant">UI/UX • Updated 1d ago</span>
                    </div>
                  </td>
                  <td class="px-md py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-medium bg-green-100 text-green-800">
                      Done
                    </span>
                  </td>
                  <td class="px-md py-3">
                    <div class="flex items-center gap-2">
                      <span class="w-1.5 h-6 rounded-full bg-outline-variant"></span>
                      <span class="font-label-md text-on-surface">Low</span>
                    </div>
                  </td>
                  <td class="px-md py-3 text-center">
                    <span class="material-symbols-outlined text-outline text-[18px]" style="font-variation-settings: 'FILL' 1;">edit_note</span>
                  </td>
                  <td class="px-md py-3">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-[10px] text-white">JD</div>
                      <span class="text-body-sm">J. Doe</span>
                    </div>
                  </td>
                  <td class="px-md py-3">
                    <button class="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-outline hover:text-on-surface">
                      <span class="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>
                <tr class="hover:bg-surface-container transition-colors group">
                  <td class="px-md py-3 font-label-md text-secondary">JM-1027</td>
                  <td class="px-md py-3">
                    <div class="flex flex-col">
                      <span class="font-body-md font-semibold text-on-surface">Database Schema Optimization</span>
                      <span class="text-label-sm text-on-surface-variant">Data Team • Updated 3h ago</span>
                    </div>
                  </td>
                  <td class="px-md py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-medium bg-error-container text-on-error-container">
                      Blocked
                    </span>
                  </td>
                  <td class="px-md py-3">
                    <div class="flex items-center gap-2">
                      <span class="w-1.5 h-6 rounded-full bg-error"></span>
                      <span class="font-label-md text-on-surface">High</span>
                    </div>
                  </td>
                  <td class="px-md py-3 text-center"></td>
                  <td class="px-md py-3">
                    <div class="flex items-center gap-2">
                      <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgcltt_c945MLhkbB16fxq3SxX6XjrJBKzg1wX6urQd2Fv2dmd2Iats2cO5jv9_QEEZrRCh1DwOfezmT5VeGdMIFH35ZOs4eToWB9-MLSxMmKBADhicRojisdSAEHK-Worjs2OkWv7-PzNBv9vNHluagpg4N7PN8ynVrkD2K9nTL8DwUNSjs1vCghutT1bOGQz0Urr0E06_NNMZzQ4TksMLjZAU2u_jvP4IzeZpc-oe63jWLPW7JMXRGvl5c16-7PQZ0xmdPYW9iw" class="w-6 h-6 rounded-full" alt="K. Vance" />
                      <span class="text-body-sm">K. Vance</span>
                    </div>
                  </td>
                  <td class="px-md py-3">
                    <button class="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-outline hover:text-on-surface">
                      <span class="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="px-md py-3 bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
            <span class="text-body-sm text-on-surface-variant">Showing 1 to 5 of 48 tasks</span>
            <div class="flex items-center gap-2">
              <button class="p-1 border border-outline-variant rounded hover:bg-surface-container-lowest disabled:opacity-50" disabled>
                <span class="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <button class="w-8 h-8 rounded bg-secondary text-white font-label-md flex items-center justify-center">1</button>
              <button class="w-8 h-8 rounded hover:bg-surface-container-lowest font-label-md flex items-center justify-center">2</button>
              <button class="w-8 h-8 rounded hover:bg-surface-container-lowest font-label-md flex items-center justify-center">3</button>
              <span class="text-body-sm px-1">...</span>
              <button class="w-8 h-8 rounded hover:bg-surface-container-lowest font-label-md flex items-center justify-center">10</button>
              <button class="p-1 border border-outline-variant rounded hover:bg-surface-container-lowest">
                <span class="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
      <div class="p-md bg-surface-container-lowest border border-outline-variant rounded-xl flex items-center gap-4">
        <div class="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
          <span class="material-symbols-outlined text-[28px]">task_alt</span>
        </div>
        <div>
          <p class="text-label-sm text-on-surface-variant uppercase">Completed Tasks</p>
          <p class="font-headline-md text-on-surface">128</p>
        </div>
      </div>
      <div class="p-md bg-surface-container-lowest border border-outline-variant rounded-xl flex items-center gap-4">
        <div class="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
          <span class="material-symbols-outlined text-[28px]">pending_actions</span>
        </div>
        <div>
          <p class="text-label-sm text-on-surface-variant uppercase">Open Issues</p>
          <p class="font-headline-md text-on-surface">34</p>
        </div>
      </div>
      <div class="p-md bg-surface-container-lowest border border-outline-variant rounded-xl flex items-center gap-4">
        <div class="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
          <span class="material-symbols-outlined text-[28px]">warning</span>
        </div>
        <div>
          <p class="text-label-sm text-on-surface-variant uppercase">Overdue Tasks</p>
          <p class="font-headline-md text-on-surface">12</p>
        </div>
      </div>
    </div>

    <!-- Contextual FAB -->
    <button class="fixed bottom-8 right-8 w-14 h-14 bg-secondary text-white rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center z-50">
      <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'wght' 600;">add</span>
    </button>
  </div>
</template>

<script setup lang="ts">
</script>
