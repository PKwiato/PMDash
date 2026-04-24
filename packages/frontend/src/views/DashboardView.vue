<template>
  <div class="max-w-7xl mx-auto p-gutter lg:p-xl">
    <!-- Header Section -->
    <div class="flex justify-between items-end mb-xl">
      <div>
        <h1 class="font-headline-xl text-headline-xl text-on-surface">System Overview</h1>
        <p class="font-body-md text-body-md text-on-primary-container mt-xs">Real-time status of monitored Jira instances and team performance.</p>
      </div>
      <div class="flex gap-sm">
        <button class="px-md py-sm bg-white border border-outline-variant rounded-lg text-body-md font-medium text-on-surface hover:bg-slate-50 transition-colors flex items-center gap-sm">
          <span class="material-symbols-outlined text-md">filter_list</span>
          Filter
        </button>
        <button class="px-md py-sm bg-secondary text-white rounded-lg text-body-md font-bold hover:opacity-90 transition-opacity flex items-center gap-sm">
          <span class="material-symbols-outlined text-md">download</span>
          Export Report
        </button>
      </div>
    </div>
    <!-- Bento Grid Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-xl">
      <div class="bg-white border border-outline-variant p-lg rounded-xl shadow-sm">
        <div class="flex items-center justify-between mb-md">
          <div class="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
            <span class="material-symbols-outlined">assignment</span>
          </div>
          <span class="text-label-sm font-label-sm text-secondary-fixed-dim">+12% vs LY</span>
        </div>
        <div class="text-headline-lg font-headline-lg text-on-surface">1,284</div>
        <div class="text-body-sm font-body-sm text-on-primary-container">Total Tasks</div>
      </div>
      <div class="bg-white border border-outline-variant p-lg rounded-xl shadow-sm">
        <div class="flex items-center justify-between mb-md">
          <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <span class="material-symbols-outlined">sync</span>
          </div>
          <span class="text-label-sm font-label-sm text-blue-600">Active Now</span>
        </div>
        <div class="text-headline-lg font-headline-lg text-on-surface">342</div>
        <div class="text-body-sm font-body-sm text-on-primary-container">In Progress</div>
      </div>
      <div class="bg-white border border-outline-variant p-lg rounded-xl shadow-sm">
        <div class="flex items-center justify-between mb-md">
          <div class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-error">
            <span class="material-symbols-outlined">block</span>
          </div>
          <span class="text-label-sm font-label-sm text-error">Requires Action</span>
        </div>
        <div class="text-headline-lg font-headline-lg text-on-surface">24</div>
        <div class="text-body-sm font-body-sm text-on-primary-container">Blocked Issues</div>
      </div>
      <div class="bg-white border border-outline-variant p-lg rounded-xl shadow-sm">
        <div class="flex items-center justify-between mb-md">
          <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-on-secondary-container">
            <span class="material-symbols-outlined">check_circle</span>
          </div>
          <span class="text-label-sm font-label-sm text-on-secondary-container">98% Success</span>
        </div>
        <div class="text-headline-lg font-headline-lg text-on-surface">892</div>
        <div class="text-body-sm font-body-sm text-on-primary-container">Resolved (Q3)</div>
      </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
      <!-- Recent Tasks Widget -->
      <div class="lg:col-span-2 bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div class="px-lg py-md border-b border-outline-variant flex items-center justify-between">
          <h2 class="font-headline-md text-headline-md">Recent Tasks</h2>
          <a class="text-secondary text-label-md font-label-md hover:underline" href="#">View All</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-slate-50 border-b border-outline-variant">
              <tr>
                <th class="px-lg py-md font-label-sm text-label-sm text-on-primary-container">KEY</th>
                <th class="px-lg py-md font-label-sm text-label-sm text-on-primary-container">SUMMARY</th>
                <th class="px-lg py-md font-label-sm text-label-sm text-on-primary-container">STATUS</th>
                <th class="px-lg py-md font-label-sm text-label-sm text-on-primary-container">PRIORITY</th>
                <th class="px-lg py-md font-label-sm text-label-sm text-on-primary-container">ASSIGNEE</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-lg py-md font-label-md text-secondary">JM-1024</td>
                <td class="px-lg py-md font-body-md text-on-surface">API Gateway Authentication Failure</td>
                <td class="px-lg py-md">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-error">Blocked</span>
                </td>
                <td class="px-lg py-md flex items-center gap-1">
                  <div class="w-1 h-3 bg-error rounded-full"></div>
                  <span class="text-label-sm text-on-primary-container">High</span>
                </td>
                <td class="px-lg py-md">
                  <div class="flex items-center gap-2">
                    <img alt="Assignee" class="w-6 h-6 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdiR52wRcDrgg-IyjdF3W4ZwqivTm74ne_R8g74CRJkuvxWQnYN61IGY2OatvYPOVEifMcgK4T-1ck0cX6aF1HiYsDLjHzR7h_IksFdgHSDfKlPn6LyU9oyYOSGt4q3Xs2GWeUt73N376DWVl9fh-2USPTcbPCVuwmMGNNCqa_5uS1U-BAWhVRBCR7x3NddSdLXt58W8D5GW_IuPbWYnHXv_PPFu-E3-pqvVfXmE2OWNfzHiFtCLraOVfBUrTKnaYXXk1opSRSsd0"/>
                    <span class="text-body-sm">Alex R.</span>
                  </div>
                </td>
              </tr>
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-lg py-md font-label-md text-secondary">JM-1025</td>
                <td class="px-lg py-md font-body-md text-on-surface">Update Dashboard Visual Tokens</td>
                <td class="px-lg py-md">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700">In Progress</span>
                </td>
                <td class="px-lg py-md flex items-center gap-1">
                  <div class="w-1 h-3 bg-amber-400 rounded-full"></div>
                  <span class="text-label-sm text-on-primary-container">Medium</span>
                </td>
                <td class="px-lg py-md">
                  <div class="flex items-center gap-2">
                    <img alt="Assignee" class="w-6 h-6 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyOns_uNDmHch62DuQ01_46b_p-vCcUOldwwHPhB45fF7NZbCs-PSzMHrAWtRdnF1R_UAnirlxdS8a33P8MEzoWw7YnDXiTsBhiN0EdIDNj55ncRhMZUQcyzQ3kv26vrSMhKoK96hPWe3ev-5Z6TOe6p0R_aF-IHs-UmchlpTQ233UsjI5lJP5Esfoaf5jCZmoeuBLsngBBVX9kQsjYtE8BRFGvxNJNQrx_dlVPE7V_P9-4ocxrJfcm27UGWqPG1JNl_BYVxbtgnU"/>
                    <span class="text-body-sm">Sarah L.</span>
                  </div>
                </td>
              </tr>
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-lg py-md font-label-md text-secondary">JM-1026</td>
                <td class="px-lg py-md font-body-md text-on-surface">Database Migration Script Review</td>
                <td class="px-lg py-md">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">To Do</span>
                </td>
                <td class="px-lg py-md flex items-center gap-1">
                  <div class="w-1 h-3 bg-amber-400 rounded-full"></div>
                  <span class="text-label-sm text-on-primary-container">Medium</span>
                </td>
                <td class="px-lg py-md">
                  <div class="flex items-center gap-2">
                    <img alt="Assignee" class="w-6 h-6 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5o5Igqr-pIUnitNM3ToIOsGxI5G_r6BOA6nmEE3av-wQMWBUOoQb00y1-KxjVqKfC92UlwXSRGrCfxGHi6WppXT7FPWWt4oBEU-LeHvTpXidJvq7msPs0RZYK2IJdmKX8FoNl457hfXydQ8x8KuXdXjQZoyOLAPZ0ngGzD8iFXoSx4JYqSf3dryb28JfmZ6LUT397alQmup8Kf8A2VtRav_o27TBTScV4vyB3WHjfkI5tibL7HkQPNghV58Ovx8FOge8sCag5H7I"/>
                    <span class="text-body-sm">Michael K.</span>
                  </div>
                </td>
              </tr>
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-lg py-md font-label-md text-secondary">JM-1027</td>
                <td class="px-lg py-md font-body-md text-on-surface">Client Feedback Integration</td>
                <td class="px-lg py-md">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-on-secondary-container">Resolved</span>
                </td>
                <td class="px-lg py-md flex items-center gap-1">
                  <div class="w-1 h-3 bg-slate-300 rounded-full"></div>
                  <span class="text-label-sm text-on-primary-container">Low</span>
                </td>
                <td class="px-lg py-md">
                  <div class="flex items-center gap-2">
                    <img alt="Assignee" class="w-6 h-6 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAm2H4oMRCNICHhhFyC2lOVQsDfwWVKjAWuyVMEf8yynL3fnGLsVeISX4lWK909ujGnMs519lm7Ci3mUEyXKK1DvoTmRr-PfJKIGcVL3axnH0ZLzDzAZErT91E4KIzWoWz0sG4WgYO753APD5UqdGsnRPrsIDCCLNlj67j7XkWltsN724-6nad0WtBN3v5Aed_XK71lr07sa5aSBgV76r4GdnN7AtYdhglBCiOojulaokd2EQxik1x0LTWqDIW2VLDw2oHR8EjdR7g"/>
                    <span class="text-body-sm">Emma D.</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- Recent Notes Widget -->
      <div class="bg-white border border-outline-variant rounded-xl shadow-sm flex flex-col">
        <div class="px-lg py-md border-b border-outline-variant flex items-center justify-between">
          <h2 class="font-headline-md text-headline-md">Recent Notes</h2>
          <button class="material-symbols-outlined text-slate-400 hover:text-slate-600">more_horiz</button>
        </div>
        <div class="p-lg space-y-lg overflow-y-auto max-h-[400px]">
          <div class="border-l-4 border-teal-600 pl-md">
            <div class="flex justify-between items-start mb-1">
              <h3 class="font-label-md text-on-surface">Sprint Planning Notes</h3>
              <span class="text-[10px] text-on-primary-container">2h ago</span>
            </div>
            <p class="text-body-sm text-on-primary-container line-clamp-2">Discussed the transition to the new auth module. Team consensus on using JWT...</p>
          </div>
          <div class="border-l-4 border-amber-400 pl-md">
            <div class="flex justify-between items-start mb-1">
              <h3 class="font-label-md text-on-surface">Bug Triage: JM-1024</h3>
              <span class="text-[10px] text-on-primary-container">5h ago</span>
            </div>
            <p class="text-body-sm text-on-primary-container line-clamp-2">Suspected issue with the load balancer config. Waiting for logs from DevOps team.</p>
          </div>
          <div class="border-l-4 border-slate-300 pl-md">
            <div class="flex justify-between items-start mb-1">
              <h3 class="font-label-md text-on-surface">Private: Personal Backlog</h3>
              <span class="text-[10px] text-on-primary-container">Yesterday</span>
            </div>
            <p class="text-body-sm text-on-primary-container line-clamp-2">Need to review the performance reports for the Q3 presentation. Focus on latencies.</p>
          </div>
          <div class="border-l-4 border-teal-600 pl-md">
            <div class="flex justify-between items-start mb-1">
              <h3 class="font-label-md text-on-surface">UI Redesign Feedback</h3>
              <span class="text-[10px] text-on-primary-container">Yesterday</span>
            </div>
            <p class="text-body-sm text-on-primary-container line-clamp-2">The team loves the new clean layout. Padding in tables could be tighter.</p>
          </div>
        </div>
        <div class="mt-auto p-lg pt-0">
          <button class="w-full py-2 border border-dashed border-outline rounded-lg text-body-sm text-on-primary-container hover:bg-slate-50 transition-colors">
            + Add quick note
          </button>
        </div>
      </div>
    </div>
    <!-- Team Activity / Analytics Preview -->
    <div class="mt-xl grid grid-cols-1 md:grid-cols-3 gap-gutter">
      <div class="md:col-span-3 bg-primary-container text-white rounded-xl p-xl relative overflow-hidden">
        <div class="relative z-10">
          <div class="inline-flex items-center gap-sm bg-teal-600/30 text-teal-400 px-md py-1 rounded-full text-label-sm mb-md">
            <span class="material-symbols-outlined text-sm">trending_up</span>
            System Health: Optimal
          </div>
          <h2 class="font-headline-xl text-headline-xl mb-md">All systems operational</h2>
          <div class="flex gap-xl">
            <div>
              <div class="text-label-sm opacity-60 uppercase mb-1">API Latency</div>
              <div class="text-headline-md">124ms</div>
            </div>
            <div>
              <div class="text-label-sm opacity-60 uppercase mb-1">Sync Success</div>
              <div class="text-headline-md">100%</div>
            </div>
            <div>
              <div class="text-label-sm opacity-60 uppercase mb-1">Uptime</div>
              <div class="text-headline-md">99.98%</div>
            </div>
          </div>
        </div>
        <!-- Decorative Background Element -->
        <div class="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-teal-600/20 to-transparent"></div>
        <div class="absolute -right-12 -bottom-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl"></div>
      </div>
    </div>

    <!-- Contextual FAB (Only on dashboard/home) -->
    <button class="fixed bottom-xl right-xl w-14 h-14 bg-secondary text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-50">
      <span class="material-symbols-outlined text-3xl">add</span>
    </button>
  </div>
</template>

<script setup lang="ts">
</script>
