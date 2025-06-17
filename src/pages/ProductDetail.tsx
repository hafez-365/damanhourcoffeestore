
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart, Star, Plus, Minus } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('available', true)
        .single();

      if (error) throw error;

      setProduct(data);
    } catch (error) {
      console.error('خطأ في جلب المنتج:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل تفاصيل المنتج",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!user) {
      toast({
        title: 'يجب تسجيل الدخول',
        description: 'يرجى تسجيل الدخول لإضافة المنتجات إلى السلة.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!product) return;

    setIsAddingToCart(true);

    try {
      const { data: existingItem, error: fetchError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        const newTotalPrice = newQuantity * Number(product.price);

        const { error: updateError } = await supabase
          .from('cart_items')
          .update({
            quantity: newQuantity,
            total_price: newTotalPrice,
          })
          .eq('user_id', user.id)
          .eq('product_id', product.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity,
            unit_price: Number(product.price),
            total_price: Number(product.price) * quantity,
          });

        if (insertError) throw insertError;
      }

      toast({
        title: 'تمت الإضافة إلى السلة',
        description: `${product.name_ar} أُضيف إلى السلة.`,
      });
    } catch (error) {
      console.error('خطأ في إضافة المنتج إلى السلة:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إضافة المنتج إلى السلة.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const increaseQuantity = () => setQuantity(q => q + 1);
  const decreaseQuantity = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
        <Navbar />
        <div className="container mx-auto px-6 py-20">
          <div className="animate-pulse">
            <div className="h-8 bg-amber-200 rounded w-1/4 mb-8"></div>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="h-96 bg-amber-200 rounded-xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-amber-200 rounded w-3/4"></div>
                <div className="h-4 bg-amber-200 rounded w-1/2"></div>
                <div className="h-24 bg-amber-200 rounded"></div>
                <div className="h-12 bg-amber-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
        <Navbar />
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-bold text-amber-900 mb-4">المنتج غير موجود</h1>
          <Button onClick={() => navigate('/')} className="bg-amber-600 hover:bg-amber-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <Navbar />
      
      <div className="container mx-auto px-6 py-20">
        <Button 
          onClick={() => navigate('/')} 
          variant="ghost" 
          className="mb-8 text-amber-700 hover:text-amber-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          العودة إلى المنتجات
        </Button>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="relative">
            <Card className="overflow-hidden">
              <img
                src={product.image_url || ''}
                alt={product.name_ar}
                className="w-full h-96 object-cover"
              />
            </Card>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-amber-900 mb-4">
                {product.name_ar}
              </h1>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < (product.rating || 0)
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-amber-700 font-medium">
                  ({product.rating || 4.5}/5)
                </span>
              </div>

              <div className="text-3xl font-bold text-amber-600 mb-6">
                {product.price} جنيه
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-3">
                وصف المنتج
              </h3>
              <p className="text-amber-800 leading-relaxed">
                {product.description_ar}
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-amber-900">الكمية:</span>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={decreaseQuantity}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-bold text-lg min-w-[2rem] text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={increaseQuantity}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span className="text-amber-900">الإجمالي:</span>
                    <span className="text-amber-600">
                      {(Number(product.price) * quantity).toFixed(2)} جنيه
                    </span>
                  </div>

                  <Button
                    onClick={addToCart}
                    disabled={isAddingToCart}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 text-lg font-semibold"
                  >
                    {isAddingToCart ? (
                      <>
                        <span className="animate-spin mr-2">↻</span>
                        جاري الإضافة...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        أضف إلى السلة
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
