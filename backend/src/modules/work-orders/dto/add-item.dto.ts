import { IsString, IsNumber, IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class AddItemDto {
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
