import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { RequireAuth, RequireAdmin } from "@/components/layout/RouteGuards";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";
import About from "./pages/About";
import Portfolio from "./pages/Portfolio";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Privacy from "./pages/Privacy";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import ClientLayout from "./pages/client/ClientLayout";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientOrders from "./pages/client/ClientOrders";
import ClientOrderDetail from "./pages/client/ClientOrderDetail";
import ClientFiles from "./pages/client/ClientFiles";
import ClientProfile from "./pages/client/ClientProfile";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductForm from "./pages/admin/AdminProductForm";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminClients from "./pages/admin/AdminClients";
import AdminFiles from "./pages/admin/AdminFiles";
import AdminSettings from "./pages/admin/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <SettingsProvider>
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/produtos" element={<Shop />} />
                  <Route path="/produtos/:categorySlug" element={<Shop />} />
                  <Route path="/produto/:productSlug" element={<ProductDetail />} />
                  <Route path="/carrinho" element={<CartPage />} />
                  <Route path="/sobre" element={<About />} />
                  <Route path="/portfolio" element={<Portfolio />} />
                  <Route path="/contato" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/privacidade" element={<Privacy />} />

                  <Route element={<RequireAuth />}>
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/checkout/sucesso" element={<CheckoutSuccess />} />
                    <Route element={<ClientLayout />}>
                      <Route path="/cliente" element={<ClientDashboard />} />
                      <Route path="/cliente/pedidos" element={<ClientOrders />} />
                      <Route path="/cliente/pedidos/:id" element={<ClientOrderDetail />} />
                      <Route path="/cliente/arquivos" element={<ClientFiles />} />
                      <Route path="/cliente/perfil" element={<ClientProfile />} />
                    </Route>
                  </Route>

                  <Route element={<RequireAdmin />}>
                    <Route element={<AdminLayout />}>
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin/pedidos" element={<AdminOrders />} />
                      <Route path="/admin/pedidos/:id" element={<AdminOrderDetail />} />
                      <Route path="/admin/produtos" element={<AdminProducts />} />
                      <Route path="/admin/produtos/novo" element={<AdminProductForm />} />
                      <Route path="/admin/produtos/:id" element={<AdminProductForm />} />
                      <Route path="/admin/categorias" element={<AdminCategories />} />
                      <Route path="/admin/banners" element={<AdminBanners />} />
                      <Route path="/admin/clientes" element={<AdminClients />} />
                      <Route path="/admin/arquivos" element={<AdminFiles />} />
                      <Route path="/admin/configuracoes" element={<AdminSettings />} />
                    </Route>
                  </Route>
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SettingsProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
