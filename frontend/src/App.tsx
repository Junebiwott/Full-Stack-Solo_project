import { onAuthStateChanged } from "firebase/auth";
import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Provider } from "react-redux"; // Import Provider from react-redux
import Header from "./components/header";
import Loader, { LoaderLayout } from "./components/loader";
import ProtectedRoute from "./components/protected-route";
import { auth } from "./firebase";
import { getUser } from "./redux/api/userAPI";
import { userExist, userNotExist } from "./redux/reducer/userReducer";
import { RootState, store } from "./redux/store"; // Import your Redux store
import Footer from "./components/footer";

const Home = lazy(() => import("./pages/Home"));
const Search = lazy(() => import("./pages/search"));
const ProductDetails = lazy(() => import("./pages/product-details"));
const Cart = lazy(() => import("./pages/cart"));
const Shipping = lazy(() => import("./pages/shipping"));
const Login = lazy(() => import("./pages/login"));
const Orders = lazy(() => import("./pages/orders"));
const OrderDetails = lazy(() => import("./pages/order-details"));
const NotFound = lazy(() => import("./pages/not-found"));
const Checkout = lazy(() => import("./pages/checkout"));

// Admin Routes Importing
const Dashboard = lazy(() => import("./pages/pages/admin/dashboard"));
const Products = lazy(() => import("./pages/pages/admin/products"));
const Customers = lazy(() => import("./pages/pages/admin/customers"));
const Transaction = lazy(() => import("./pages/pages/admin/transaction"));
const Discount = lazy(() => import("./pages/pages/admin/discount"));
const Barcharts = lazy(() => import("./pages/pages/admin/charts/barcharts"));
const Piecharts = lazy(() => import("./pages/pages/admin/charts/piecharts"));
const Linecharts = lazy(() => import("./pages/pages/admin/charts/linecharts"));
const Coupon = lazy(() => import("./pages/pages/admin/apps/coupon"));
const Stopwatch = lazy(() => import("./pages/pages/admin/apps/stopwatch"));
const Toss = lazy(() => import("./pages/pages/admin/apps/toss"));
const NewProduct = lazy(() => import("./pages/pages/admin/management/newproduct"));
const ProductManagement = lazy(
  () => import("./pages/pages/admin/management/productmanagement")
);
const TransactionManagement = lazy(
  () => import("./pages/pages/admin/management/transactionmanagement")
);
const DiscountManagement = lazy(
  () => import("./pages/pages/admin/management/discountmanagement")
);

const NewDiscount = lazy(() => import("./pages/pages/admin/management/newdiscount"));

const App = () => {
  const { user, loading } = useSelector(
    (state: RootState) => state.userReducer
  );

  const dispatch = useDispatch();

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const data = await getUser(user.uid);
        dispatch(userExist(data.user));
      } else dispatch(userNotExist());
    });
  }, [dispatch]);

  return loading ? (
    <Loader />
  ) : (
    <Router>
      {/* Header */}
      <Header user={user} />
      <Suspense fallback={<LoaderLayout />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          {/* Not logged In Route */}
          <Route
            path="/login"
            element={
              <ProtectedRoute isAuthenticated={user ? false : true}>
                <Login />
              </ProtectedRoute>
            }
          />
          {/* Logged In User Routes */}
          <Route
            element={<ProtectedRoute isAuthenticated={user ? true : false} />}
          >
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/order/:id" element={<OrderDetails />} />
            <Route path="/pay" element={<Checkout />} />
          </Route>
          {/* Admin Routes */}
          <Route
            element={
              <ProtectedRoute
                isAuthenticated={true}
                adminOnly={true}
                admin={user?.role === "admin" ? true : false}
              />
            }
          >
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/product" element={<Products />} />
            <Route path="/admin/customer" element={<Customers />} />
            <Route path="/admin/transaction" element={<Transaction />} />
            <Route path="/admin/discount" element={<Discount />} />

            {/* Charts */}
            <Route path="/admin/chart/bar" element={<Barcharts />} />
            <Route path="/admin/chart/pie" element={<Piecharts />} />
            <Route path="/admin/chart/line" element={<Linecharts />} />
            {/* Apps */}
            <Route path="/admin/app/coupon" element={<Coupon />} />
            <Route path="/admin/app/stopwatch" element={<Stopwatch />} />
            <Route path="/admin/app/toss" element={<Toss />} />

            {/* Management */}
            <Route path="/admin/product/new" element={<NewProduct />} />

            <Route path="/admin/product/:id" element={<ProductManagement />} />

            <Route
              path="/admin/transaction/:id"
              element={<TransactionManagement />}
            />

            <Route path="/admin/discount/new" element={<NewDiscount />} />

            <Route
              path="/admin/discount/:id"
              element={<DiscountManagement />}
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Footer />
      <Toaster position="bottom-center" />
    </Router>
  );
};

// Wrap the App component in a Provider and pass the store
const RootApp = () => (
  <Provider store={store}>
    <App />
  </Provider>
);

export default RootApp;
