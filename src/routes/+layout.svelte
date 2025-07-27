<script lang="ts">
  import '../app.css';
  import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset } from '$lib/components/ui/sidebar';
  import { Button } from '$lib/components/ui/button';
  import { Home, FileText, DollarSign, Settings, Users, BarChart3, Bell } from '@lucide/svelte';
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
  
  const menuItems = [
    { title: 'Dashboard', url: '/', icon: Home },
    { title: 'Invoices', url: '/invoices', icon: FileText },
    { title: 'Payments', url: '/payments', icon: DollarSign },
    { title: 'Clients', url: '/clients', icon: Users },
    { title: 'Reports', url: '/reports', icon: BarChart3 },
    { title: 'Notifications', url: '/notifications', icon: Bell },
    { title: 'Settings', url: '/settings', icon: Settings },
  ];
</script>

<SidebarProvider>
  <Sidebar>
    <SidebarHeader>
      <div class="p-4">
        <h2 class="text-lg font-semibold">Invoice Manager</h2>
        <p class="text-sm text-muted-foreground">Professional invoicing</p>
      </div>
    </SidebarHeader>
    
    <SidebarContent>
      <SidebarMenu>
        {#each menuItems as item}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href={item.url} class="flex items-center gap-3">
                <item.icon class="w-4 h-4" />
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        {/each}
      </SidebarMenu>
    </SidebarContent>
    
    <SidebarFooter>
      <div class="p-4">
        <Button variant="outline" size="sm" class="w-full">
          <Settings class="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>
    </SidebarFooter>
  </Sidebar>
  
  <SidebarInset>
    <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <div class="flex-1"></div>
      <Button variant="outline" size="sm">
        <Bell class="w-4 h-4" />
      </Button>
    </header>
    
    <main class="flex-1 p-6">
      {@render children?.()}
    </main>
  </SidebarInset>
</SidebarProvider>
