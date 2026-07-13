import { IsEnum, IsString, IsNumber, IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class AddItemDto {
  @IsEnum(['part', 'labor'])
  @IsNotEmpty()
  type: 'part' | 'labor';

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsInt()
  @IsPositive()
  qty: number = 1;
}
