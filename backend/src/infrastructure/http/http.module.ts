import { Module } from "@nestjs/common";
import { HttpPriceClient } from "./http-price.client";

@Module({
  providers: [HttpPriceClient],
  exports: [HttpPriceClient],
})
export class HttpModule {}
