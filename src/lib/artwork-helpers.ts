import { supabase } from '@/integrations/supabase/client';

export const checkAndAdvanceOrder = async (orderItemId: string) => {
  if (!orderItemId) return;

  const { data: item } = await supabase
    .from('order_items')
    .select('order_id')
    .eq('id', orderItemId)
    .single();

  if (!item?.order_id) return;

  const { data: allItems } = await supabase
    .from('order_items')
    .select('artwork_status')
    .eq('order_id', item.order_id);

  const allDone = allItems?.every((i) =>
    i.artwork_status === 'approved' || i.artwork_status === 'not_required'
  );

  if (allDone) {
    await supabase.from('orders').update({ status: 'in_production' }).eq('id', item.order_id);
    await supabase.from('order_timeline').insert({
      order_id: item.order_id,
      status: 'in_production',
      message: '✅ Arte aprovada! Pedido em produção.',
    });
  } else {
    await supabase.from('order_timeline').insert({
      order_id: item.order_id,
      status: 'awaiting_artwork',
      message: '✅ Arte de um item aprovada. Aguardando demais artes.',
    });
  }
};

export const recordArtRejection = async (orderItemId: string, reason: string) => {
  if (!orderItemId) return;

  const { data: item } = await supabase
    .from('order_items')
    .select('order_id')
    .eq('id', orderItemId)
    .single();

  if (!item?.order_id) return;

  await supabase.from('order_timeline').insert({
    order_id: item.order_id,
    status: 'awaiting_artwork',
    message: `❌ Arte rejeitada. Motivo: ${reason}. Por favor, reenvie um novo arquivo.`,
  });
};
