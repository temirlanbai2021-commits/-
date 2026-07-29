type Props = {
  ammo: number;
  coins: number;
  onBuy: () => void;
};

const PACK_SIZE = 30;
const PACK_PRICE = 40;

export function AmmoStore({ ammo, coins, onBuy }: Props) {
  return (
    <div className="ammo-store">
      <span>ПАТРОНЫ <b>{ammo}</b></span>
      <button type="button" disabled={coins < PACK_PRICE} onClick={onBuy}>
        +{PACK_SIZE} за {PACK_PRICE} 🪙
      </button>
    </div>
  );
}
