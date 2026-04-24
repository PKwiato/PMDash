<template>
  <div class="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
    <!-- Toolbar / Breadcrumbs -->
    <div class="h-12 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-slate-400 font-label-sm text-label-sm uppercase">Projects</span>
        <span class="text-slate-300">/</span>
        <span class="text-slate-400 font-label-sm text-label-sm uppercase">JIRA-742</span>
        <span class="text-slate-300">/</span>
        <span class="text-slate-900 font-label-md text-label-md">Refactor Authentication Middleware</span>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex -space-x-2">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxuXbVfCrG8iOqLegQf8CXO4bWg4q00qqtJJDNV4W8w8LxmUWNtnBK5CxvQr4x9YNahHs9rmZW6jEeMHf3BZR_8ijcAusV0nhSDGWPIgNhA_9xjj1KGURqO7k0W4EiZmFLZ-lEmyJwhF1W7Euoa304_LZNAOgc2sgDaB8QQXC-lLpzQ7ejjU6MKqFSwaM6nbhDENX2an4v9loI1hGuILuMq6zI3orIGWH8WnB7tf9XzN6nQtsLWMtEcBk-JlSkcXlLSMGH4RPWUU8" class="w-6 h-6 rounded-full border-2 border-white" alt="Team member" />
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPYehe3qBAb2zZ2ZlcjWt72CgiS2LwBlv6Y745DPmzlv6EC-p1iGB9InOY8vJ88ETpsZ0v-mV7lablp3Ss3vKZnnis38zPOu91S9egzjyOsAaTGtVHq0gCusjloRRRU5gebCo6XgVnKbBkfaYoYMlRP1Y_Inuwvp3aesO2q2X2EMvuo45MPGh2W3Z3Fb5C9LgRccR1I36z3PdFAuA-7D3EoQpT8AncsvV6EnQ92y4FFMX2N5IX4VR1GFH-VwvhmHcLSLM6dBvRrIE" class="w-6 h-6 rounded-full border-2 border-white" alt="Team member" />
          <div class="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">+3</div>
        </div>
        <button class="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-label-sm text-label-sm">
          <span class="material-symbols-outlined text-[16px]">share</span>
          Share
        </button>
      </div>
    </div>
    <!-- Task Content Area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Panel: Official Jira Data -->
      <div class="flex-1 overflow-y-auto p-6 bg-white border-r border-slate-200 custom-scrollbar">
        <div class="max-w-4xl mx-auto space-y-8">
          <!-- Header Info -->
          <div class="space-y-4">
            <div class="flex items-start justify-between">
              <h1 class="font-headline-lg text-headline-lg text-slate-900">Refactor Authentication Middleware for OAuth2.0 Support</h1>
              <div class="flex gap-2">
                <span class="px-2 py-1 bg-secondary-container text-on-secondary-container rounded font-label-sm text-label-sm flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-secondary"></span>
                  IN PROGRESS
                </span>
                <span class="px-2 py-1 bg-error-container text-on-error-container rounded font-label-sm text-label-sm flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">priority_high</span>
                  HIGH
                </span>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-6 py-4 border-y border-slate-100">
              <div>
                <p class="text-slate-400 font-label-sm text-label-sm uppercase mb-1">Assignee</p>
                <div class="flex items-center gap-2">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2Cs7-phE7K859Ovu3rIAc1TIAR59V5BBAo5sbAMzL-GjbvkNTL_C_BE17dqUCZ9saK5hvLuAQdLp8WDn0ki3-fsiqcDbbo-eosK3o6s9qY-ycHL51Q99xgQZMmXqNBrrmSo8Endw2UmjIogj1v1sRTgmiwZRjP3ndfBrD_5BjID-SFr3tEU_iLKVTAEyDgf2mncFBtbMQ7QSYmJVfWs-GZf19LIBP1qRDTI5XrGKz9BMmY-6Qbb0J1hOFgFQEJS-_NxK5kKoZYAI" class="w-6 h-6 rounded-full" alt="Assignee avatar" />
                  <span class="font-body-md text-body-md text-slate-900 font-medium">Alex Rivera</span>
                </div>
              </div>
              <div>
                <p class="text-slate-400 font-label-sm text-label-sm uppercase mb-1">Reporter</p>
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-slate-400 text-[20px]">person</span>
                  <span class="font-body-md text-body-md text-slate-600">Sarah Jenkins</span>
                </div>
              </div>
              <div>
                <p class="text-slate-400 font-label-sm text-label-sm uppercase mb-1">Due Date</p>
                <span class="font-body-md text-body-md text-slate-900">Oct 24, 2023</span>
              </div>
            </div>
          </div>
          <!-- Description Section -->
          <div class="space-y-3">
            <h3 class="font-headline-md text-headline-md text-slate-900">Description</h3>
            <div class="font-body-lg text-body-lg text-slate-700 leading-relaxed space-y-4">
              <p>We need to update the core authentication middleware to support the new OAuth2.0 identity provider. This involves migrating away from the legacy JWT implementation and ensuring backward compatibility for the next two releases.</p>
              <ul class="list-disc ml-5 space-y-1">
                <li>Update <code class="bg-slate-100 px-1 rounded text-error">AuthService.ts</code> to handle new token exchange flows.</li>
                <li>Implement silent refresh logic in the background.</li>
                <li>Add telemetry for authentication latency tracking.</li>
              </ul>
            </div>
          </div>
          <!-- Comments Section -->
          <div class="space-y-6 pt-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 class="font-headline-md text-headline-md text-slate-900">Comments (3)</h3>
              <button class="text-secondary font-label-md text-label-md hover:underline">Add Comment</button>
            </div>
            <div class="space-y-6">
              <!-- Comment 1 -->
              <div class="flex gap-4">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDx0YxnX_hHaoVKXdUite_HWDtnz9uDFBeGcFhWvFepTww_C42YdV24m7mIEmwJVYcRj9_Zta-TQGGnpPdSS4U3oaaLx3oQrwSQ5hQ5rsi1JvFXWz-QVNuWRtJbPMqTSJgQieFm8TQihOFmciNK0LuzjZPvpmprgV-tC3ZHkRKUYy7m6d_CcHI2XhgSbsHC7tuxCZbMAxSAJSrJBADivYjwbW6_A1A8jx_OQBDdjzy8qsNx3PbQfLICG39wBeCrY0qMaxj43NdX7k0" class="w-8 h-8 rounded-full shrink-0" alt="User 3" />
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-900 text-sm">Marcus Thorne</span>
                    <span class="text-slate-400 text-xs">2 hours ago</span>
                  </div>
                  <p class="text-slate-700 text-sm">I've verified the new provider's discovery endpoint. It seems to be returning the correct scopes now.</p>
                  <div class="flex items-center gap-3 pt-1">
                    <button class="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1">
                      <span class="material-symbols-outlined text-[14px]">thumb_up</span> 2
                    </button>
                    <button class="text-slate-400 hover:text-slate-600 text-xs">Reply</button>
                  </div>
                </div>
              </div>
              <!-- Comment 2 -->
              <div class="flex gap-4">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1qQC1pZrFmnYUG-SCXpjCtfrZot3Z2gWJrbY9zyC4GFs7Ed4ZN3e55YUnzNKynje6mUD-havn-oPpC0O_7F2I-1WijX2BGH5gqrGJpmiDUzXPD3mHOSQk3l-V_AkPCklazuJLoVeoHqocO64zGHQd1PBzr5Pp5lsFF_Yy8WIdmzmFBgr5-nWgQFY7MIuuX6HonrUVSLLeIGU1fGeEm2SQMoITb4nsDcDwz2MXM8eWfF3G8hziR-9kZW7M5mVqZO2y56y3Q_TMnjw" class="w-8 h-8 rounded-full shrink-0" alt="User 1" />
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-900 text-sm">Alex Rivera</span>
                    <span class="text-slate-400 text-xs">45 minutes ago</span>
                  </div>
                  <p class="text-slate-700 text-sm">Thanks Marcus. I'll start the implementation this afternoon. Does anyone have the latest certs for the staging environment?</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Right Panel: Private Notes (Dedicated Rich Text Editor) -->
      <div class="w-[450px] bg-slate-50 border-l border-slate-200 flex flex-col">
        <div class="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div class="flex items-center gap-2 text-teal-700">
            <span class="material-symbols-outlined">edit_note</span>
            <h2 class="font-headline-md text-headline-md">Private Notes</h2>
          </div>
          <div class="flex gap-2">
            <button class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors" title="Lock Note">
              <span class="material-symbols-outlined text-[20px]">lock_open</span>
            </button>
            <button class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors">
              <span class="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
          </div>
        </div>
        <!-- Rich Text Editor Container -->
        <div class="flex-1 flex flex-col p-6 space-y-4">
          <div class="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden focus-within:border-teal-500 transition-all">
            <!-- Editor Toolbar -->
            <div class="px-3 py-2 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-1">
              <button class="p-1.5 hover:bg-white rounded text-slate-600"><span class="material-symbols-outlined text-[18px]">format_bold</span></button>
              <button class="p-1.5 hover:bg-white rounded text-slate-600"><span class="material-symbols-outlined text-[18px]">format_italic</span></button>
              <button class="p-1.5 hover:bg-white rounded text-slate-600"><span class="material-symbols-outlined text-[18px]">format_underlined</span></button>
              <div class="w-[1px] bg-slate-200 mx-1"></div>
              <button class="p-1.5 hover:bg-white rounded text-slate-600"><span class="material-symbols-outlined text-[18px]">format_list_bulleted</span></button>
              <button class="p-1.5 hover:bg-white rounded text-slate-600"><span class="material-symbols-outlined text-[18px]">format_list_numbered</span></button>
              <div class="w-[1px] bg-slate-200 mx-1"></div>
              <button class="p-1.5 hover:bg-white rounded text-slate-600"><span class="material-symbols-outlined text-[18px]">link</span></button>
              <button class="p-1.5 hover:bg-white rounded text-slate-600"><span class="material-symbols-outlined text-[18px]">image</span></button>
              <button class="p-1.5 hover:bg-white rounded text-slate-600 ml-auto"><span class="material-symbols-outlined text-[18px]">code</span></button>
            </div>
            <!-- Editor Content -->
            <div class="flex-1 p-4 font-body-md text-body-md text-slate-800 outline-none overflow-y-auto" contenteditable="true">
              <p class="font-bold text-slate-900 mb-2">My implementation strategy:</p>
              <p class="mb-4">1. First, I'll build a wrapper around the <code>AuthClient</code> to isolate the legacy logic. This way we can toggle between versions if the new system has spikes.</p>
              <p class="mb-4 text-slate-400 italic">Thinking out loud: Should we use a factory pattern here?</p>
              <p class="mb-4">2. Need to check the memory leak issue we saw in the staging logs last week when the tokens expire. Marcus mentioned it might be related to the session storage listener.</p>
              <div class="p-3 bg-teal-50 border-l-4 border-teal-500 rounded-r text-teal-800 mb-4">
                <span class="font-bold">TODO:</span> Sync with DevOps regarding the new environment variables for Client Secret.
              </div>
              <p>3. Plan the migration path for the mobile app users.</p>
            </div>
            <!-- Editor Footer -->
            <div class="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Auto-saved 2m ago</span>
              <div class="flex items-center gap-2">
                <button class="px-3 py-1 text-slate-500 font-label-sm text-label-sm hover:bg-slate-100 rounded">Clear</button>
                <button class="px-4 py-1.5 bg-secondary text-white font-label-md text-label-md rounded shadow-sm hover:opacity-90 active:scale-95 transition-all">Save Note</button>
              </div>
            </div>
          </div>
          <!-- Quick Insights Grid (Bento style) -->
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
              <p class="text-xs text-slate-400 font-bold mb-1">LINKS</p>
              <div class="flex items-center gap-2 text-teal-600 text-xs font-medium truncate">
                <span class="material-symbols-outlined text-[14px]">link</span>
                confluence.wiki/auth-v2
              </div>
            </div>
            <div class="p-3 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
              <p class="text-xs text-slate-400 font-bold mb-1">REMINDER</p>
              <div class="flex items-center gap-2 text-error text-xs font-medium">
                <span class="material-symbols-outlined text-[14px]">event</span>
                Tomorrow, 10:00 AM
              </div>
            </div>
            <div class="col-span-2 p-3 bg-primary-container text-on-primary-container rounded-lg flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-teal-400">psychology</span>
                <span class="text-xs font-medium">AI Insights: Suggesting 2 relevant tasks</span>
              </div>
              <span class="material-symbols-outlined text-[16px]">chevron_right</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
