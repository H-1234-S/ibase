import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { RegisterDto } from '../../../src/auth/dto/auth.dto.js';

describe('RegisterDto', () => {
  it('accepts passwords at the 8 and 20 character limits', async () => {
    for (const password of ['a'.repeat(8), 'a'.repeat(20)]) {
      const errors = await validate(
        plainToInstance(RegisterDto, {
          name: 'New user',
          email: 'person@example.com',
          password,
          code: '123456',
        }),
      );

      expect(errors).toEqual([]);
    }
  });

  it('rejects passwords shorter than 8 or longer than 20 characters', async () => {
    for (const [password, constraint] of [
      ['a'.repeat(7), 'minLength'],
      ['a'.repeat(21), 'maxLength'],
    ] as const) {
      const errors = await validate(
        plainToInstance(RegisterDto, {
          name: 'New user',
          email: 'person@example.com',
          password,
          code: '123456',
        }),
      );

      expect(
        errors.find(({ property }) => property === 'password')?.constraints,
      ).toHaveProperty(constraint);
    }
  });
});
